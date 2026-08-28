-- ============================================================
-- CAPPTURE — PayFast signature correctness fix
--
-- PayFast's *redirect* signature is computed over the parameters
-- in the ORDER THEY APPEAR IN THE DOCUMENTATION (NOT alphabetical),
-- with every value PHP-URL-encoded (uppercase escapes, '+' for
-- spaces). The *ITN* signature uses alphabetical (ksort) ordering,
-- also with urlencoded values.
--
-- Previous implementation sorted alphabetically for the redirect
-- and did not urlencode, so PayFast rejected every submitted form
-- with "Generated signature does not match submitted signature".
--
-- This migration:
--   1. adds public.urlencode()  (PHP-compatible urlencode)
--   2. rewrites payfast_redirect_data()  to sign in doc order
--   3. rewrites verify_payfast_itn()     to urlencode values
-- ============================================================

-- ---------- 1. PHP-compatible urlencode ----------
-- Keeps A-Z a-z 0-9 - _ . literal, encodes space as '+', and every
-- other UTF-8 byte as %XX with UPPERCASE hex (matches PHP urlencode()).
create or replace function public.urlencode(p_input text)
returns text
language plpgsql
immutable strict
set search_path = public
as $$
declare
  v_out text := '';
  v_chr text;
  v_hex text;
  v_i   integer;
begin
  for v_i in 1..char_length(p_input) loop
    v_chr := substr(p_input, v_i, 1);
    if v_chr ~ '^[A-Za-z0-9_.\-]$' then
      v_out := v_out || v_chr;
    elsif v_chr = ' ' then
      v_out := v_out || '+';
    else
      v_hex := upper(encode(convert_to(v_chr, 'UTF8'), 'hex'));
      v_out := v_out || regexp_replace(v_hex, '(..)', '%\1', 'g');
    end if;
  end loop;
  return v_out;
end;
$$;

-- ---------- 2. Redirect: sign in documentation order ----------
create or replace function public.payfast_redirect_data(p_payment_ref text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id  uuid := auth.uid();
  v_pay      public.payfast_payments%rowtype;
  v_cfg      public.payfast_config%rowtype;
  v_email    text;
  v_full     text;
  v_first    text;
  v_last     text;
  v_amount   text;
  v_name     text;
  v_desc     text;
  v_fields   jsonb;
  v_data     text;
  v_signature text;
  v_base     text;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  select * into v_cfg from public.payfast_config where id = 1;
  if not found then raise exception 'PayFast is not configured'; end if;
  if v_cfg.merchant_id = '' or v_cfg.merchant_key = '' then
    raise exception 'PayFast merchant details are not configured';
  end if;
  if v_cfg.notify_url = '' or v_cfg.return_url = '' or v_cfg.cancel_url = '' then
    raise exception 'PayFast return and cancel URLs are not configured';
  end if;

  select * into v_pay from public.payfast_payments
  where payment_ref = p_payment_ref and buyer_user_id = v_user_id;
  if not found then raise exception 'payment session not found'; end if;
  if v_pay.status <> 'pending' then raise exception 'payment session is not pending'; end if;

  select email, full_name into v_email, v_full
  from public.profiles where id = v_user_id;

  v_first := coalesce(nullif(split_part(v_full, ' ', 1), ''), 'CAPPTURE');
  v_last  := case when position(' ' in v_full) > 0
                  then substr(v_full, position(' ' in v_full) + 1)
                  else 'Customer' end;
  v_last  := coalesce(nullif(v_last, ''), 'Customer');

  v_amount := trim(to_char(v_pay.amount, '999999999999990.00'));
  v_name   := left(coalesce(v_cfg.merchant_name, 'CAPPTURE') || ' - order ' || p_payment_ref, 100);
  v_desc   := v_pay.item_count || ' item(s)';

  v_base := case when v_cfg.sandbox then 'https://sandbox.payfast.co.za'
                 else 'https://www.payfast.co.za' end;

  v_fields := jsonb_build_object(
    'merchant_id',     v_cfg.merchant_id,
    'merchant_key',    v_cfg.merchant_key,
    'return_url',      v_cfg.return_url,
    'cancel_url',      v_cfg.cancel_url,
    'notify_url',      v_cfg.notify_url,
    'name_first',      v_first,
    'name_last',       v_last,
    'email_address',   v_email,
    'm_payment_id',    p_payment_ref,
    'amount',          v_amount,
    'item_name',       v_name,
    'item_description', v_desc
  );

  -- Signature over the DOCUMENTED parameter order, values urlencoded.
  v_data :=
    'merchant_id='      || public.urlencode(v_cfg.merchant_id) ||
    '&merchant_key='    || public.urlencode(v_cfg.merchant_key) ||
    '&return_url='      || public.urlencode(v_cfg.return_url) ||
    '&cancel_url='      || public.urlencode(v_cfg.cancel_url) ||
    '&notify_url='      || public.urlencode(v_cfg.notify_url) ||
    '&name_first='      || public.urlencode(v_first) ||
    '&name_last='       || public.urlencode(v_last) ||
    '&email_address='   || public.urlencode(v_email) ||
    '&m_payment_id='    || public.urlencode(p_payment_ref) ||
    '&amount='          || public.urlencode(v_amount) ||
    '&item_name='       || public.urlencode(v_name) ||
    '&item_description='|| public.urlencode(v_desc);

  if v_cfg.passphrase <> '' then
    v_data := v_data || '&passphrase=' || public.urlencode(v_cfg.passphrase);
  end if;
  v_signature := md5(v_data);

  return jsonb_build_object(
    'base_url',  v_base,
    'payment_ref', p_payment_ref,
    'amount',    v_amount,
    'signature', v_signature,
    'fields', v_fields || jsonb_build_object('signature', v_signature)
  );
end;
$$;

revoke all on function public.payfast_redirect_data(text) from public;
grant execute on function public.payfast_redirect_data(text) to authenticated;

-- ---------- 3. ITN: alphabetical order, urlencoded values ----------
create or replace function public.verify_payfast_itn(
  p_signature text,
  p_payload   jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cfg  public.payfast_config%rowtype;
  v_data text;
begin
  if p_signature is null or p_payload is null or p_payload = '{}'::jsonb then
    return false;
  end if;

  select * into v_cfg from public.payfast_config where id = 1;
  if not found then return false; end if;

  select string_agg(key || '=' || public.urlencode(value), '&' order by key)
    into v_data
  from jsonb_each_text(p_payload)
  where value <> '';

  if v_cfg.passphrase <> '' then
    v_data := v_data || '&passphrase=' || public.urlencode(v_cfg.passphrase);
  end if;

  return md5(v_data) = lower(btrim(p_signature));
end;
$$;

revoke all on function public.verify_payfast_itn(text, jsonb) from public;
grant execute on function public.verify_payfast_itn(text, jsonb) to service_role;