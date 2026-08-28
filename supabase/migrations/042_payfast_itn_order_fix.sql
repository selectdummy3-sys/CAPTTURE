-- PayFast signs the ITN over the parameters in the exact order it posts them,
-- with url-encoded values and the signature field excluded.
-- jsonb can not preserve that order, so verify the raw data string instead.

drop function if exists public.verify_payfast_itn(text, jsonb);

create or replace function public.verify_payfast_itn(
  p_signature text,
  p_data      text
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
  if p_signature is null or p_data is null or btrim(p_data) = '' then
    return false;
  end if;

  select * into v_cfg from public.payfast_config where id = 1;
  if not found then return false; end if;

  v_data := btrim(p_data);
  -- PayFast appends the passphrase to the parameter string before hashing.
  if v_cfg.passphrase <> '' then
    v_data := v_data || '&passphrase=' || public.urlencode(btrim(v_cfg.passphrase));
  end if;

  return md5(v_data) = lower(btrim(p_signature));
end;
$$;

revoke all on function public.verify_payfast_itn(text, text) from public;
grant execute on function public.verify_payfast_itn(text, text) to service_role;