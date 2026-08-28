-- ============================================================
-- CAPPTURE — PayFast online payments (sandbox-first)
--
-- Adds PayFast as a checkout payment method for the marketplace.
--   * orders.payment_method    now allows 'payfast'
--   * orders.payment_status    now allows 'failed'
--   * orders.payfast_ref       links orders to a PayFast session
--   * payfast_config           (RLS-locked) merchant credentials &
--                              return/cancel/notify URLs. Secrets are
--                              NEVER readable by anon/authenticated;
--                              only SECURITY DEFINER RPCs touch them.
--   * payfast_payments         one row per redirect session
--   * payfast_order_links      which orders belong to a session
--
-- Payment flow
--   checkout -> place_order(payfast) per seller
--            -> begin_payfast_payment(orders)  -> payment_ref
--            -> payfast_redirect_data(ref)     -> signed form fields
--            -> browser POSTs form to PayFast
--   PayFast  -> POST payment_status ITN to /functions/v1/payfast-itn
--            -> edge fn verifies signature (SQL) + session (POST-back)
--            -> apply_payfast_itn() settles orders when COMPLETE
-- ============================================================

-- ---------- 1. Orders: allow 'payfast' + failure state ----------
alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders
  add constraint orders_payment_method_check
  check (payment_method in ('cod', 'eft', 'wallet', 'payfast'));

alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders
  add constraint orders_payment_status_check
  check (payment_status in ('unpaid', 'pending_confirmation', 'paid', 'failed'));

alter table public.orders add column payfast_ref text;

-- ---------- 2. PayFast merchant configuration (private) ----------
create table if not exists public.payfast_config (
  id            integer     primary key check (id = 1),
  merchant_id   text        not null default '',
  merchant_key  text        not null default '',
  passphrase    text        not null default '',
  sandbox       boolean     not null default true,
  merchant_name text        not null default 'CAPPTURE',
  return_url    text        not null default '',
  cancel_url    text        not null default '',
  notify_url    text        not null default 'https://kzotycqormnbgvcpktdv.functions.supabase.co/payfast-itn',
  updated_at    timestamptz not null default now()
);

insert into public.payfast_config (id)
values (1)
on conflict (id) do nothing;

-- Secrets must not be readable by anon/authenticated. No SELECT policy
-- is created, and direct table access is revoked for end-user roles.
alter table public.payfast_config enable row level security;
revoke all on table public.payfast_config from anon, authenticated;

-- Seed the public PayFast sandbox demo merchant so the flow is testable
-- immediately. Admins replace these with their own sandbox (or live)
-- merchant credentials from the Admin > Settings page.
update public.payfast_config set
  merchant_id  = case when merchant_id  = '' then '10000100' else merchant_id  end,
  merchant_key = case when merchant_key = '' then '46f0cd694581a' else merchant_key end,
  merchant_name = 'CAPPTURE'
where id = 1;

-- ---------- 3. PayFast payment sessions ----------
create sequence if not exists public.payfast_ref_seq;

create table if not exists public.payfast_payments (
  id             bigint generated always as identity primary key,
  payment_ref    text        not null unique,
  buyer_user_id  uuid        not null references public.profiles(id),
  amount         numeric(12, 2) not null,
  item_count     integer     not null default 0,
  status         text        not null default 'pending'
                 check (status in ('pending', 'complete', 'cancelled', 'failed')),
  pf_payment_id  text,
  payfast_status text,
  itn_payload    jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.payfast_order_links (
  payment_id bigint not null references public.payfast_payments(id) on delete cascade,
  order_id   uuid   not null references public.orders(id) on delete cascade,
  primary key (payment_id, order_id)
);

create index if not exists payfast_payments_buyer_idx
  on public.payfast_payments (buyer_user_id, created_at desc);
create index if not exists payfast_order_links_order_idx
  on public.payfast_order_links (order_id);

alter table public.payfast_payments enable row level security;

create policy "payfast_payments_select_own"
  on public.payfast_payments for select
  using (buyer_user_id = auth.uid());

create policy "payfast_payments_write_admin"
  on public.payfast_payments for all
  using (public.is_admin());

-- Links are internal to the payment session; only SECURITY DEFINER
-- functions read/write them.
alter table public.payfast_order_links enable row level security;

-- ---------- 4. place_order(): accept 'payfast' ----------
create or replace function public.place_order(
  p_seller_id        uuid,
  p_items            jsonb,
  p_payment_method   text,
  p_shipping_address jsonb,
  p_billing_address  jsonb default null,
  p_notes            text default null,
  p_coupon_code      text default null,
  p_delivery_method  text default 'shipping',
  p_pep_store_id     uuid default null,
  p_pep_delivery_tier text default 'standard'
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id        uuid := auth.uid();
  v_item           jsonb;
  v_product        public.products%rowtype;
  v_qty            integer;
  v_size           text;
  v_colour         text;
  v_unit_price     numeric(12, 2);
  v_subtotal       numeric(12, 2) := 0;
  v_discount       numeric(12, 2) := 0;
  v_coupon         public.coupons%rowtype;
  v_shipping       numeric(12, 2) := 0;
  v_total          numeric(12, 2) := 0;
  v_order_id       uuid;
  v_commission_rate numeric(5, 4);
  v_free_shipping_threshold numeric(12, 2) := 100000;
  v_shipping_base  numeric(12, 2) := 60;
  v_settings       jsonb;
  v_comm_enabled   boolean := true;
  v_default_rate   numeric(5, 4) := 0.08;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'order has no items';
  end if;

  if p_payment_method not in ('cod', 'eft', 'payfast') then
    raise exception 'unsupported payment method';
  end if;

  if p_delivery_method not in ('shipping', 'pep_collect') then
    raise exception 'unsupported delivery method';
  end if;

  if p_delivery_method = 'pep_collect' and p_pep_store_id is null then
    raise exception 'a PEP store must be selected for click & collect';
  end if;

  if p_delivery_method = 'pep_collect' and p_pep_delivery_tier not in ('standard', 'express') then
    raise exception 'unsupported PEP delivery speed';
  end if;

  if p_delivery_method = 'pep_collect' then
    perform 1 from public.pep_stores where id = p_pep_store_id;
    if not found then
      raise exception 'selected PEP store does not exist';
    end if;
  end if;

  -- Sellers must exist and be approved.
  perform 1 from public.sellers
  where id = p_seller_id and application_status = 'approved';
  if not found then
    raise exception 'seller is not active';
  end if;

  -- Loop items, lock product rows, validate stock, snapshot prices.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid
    for update;

    if not found then
      raise exception 'product not found';
    end if;
    if v_product.status <> 'published' then
      raise exception 'product "%" is not available', v_product.name;
    end if;

    v_qty    := coalesce((v_item ->> 'quantity')::integer, 0);
    v_size   := v_item ->> 'size';
    v_colour := v_item ->> 'colour';
    if v_qty < 1 then
      raise exception 'invalid quantity';
    end if;
    if v_product.stock < v_qty then
      raise exception 'only % left in stock for "%"', v_product.stock, v_product.name;
    end if;

    v_unit_price := coalesce(v_product.sale_price, v_product.price);
    v_subtotal   := v_subtotal + (v_unit_price * v_qty);
  end loop;

  -- Coupon validation (platform-wide or belonging to this seller).
  if p_coupon_code is not null and p_coupon_code <> '' then
    select * into v_coupon
    from public.coupons
    where upper(code) = upper(p_coupon_code)
      and (seller_id is null or seller_id = p_seller_id)
      and is_active = true
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at > now())
      and (usage_limit is null or used_count < usage_limit);
    if not found then
      raise exception 'coupon is not valid';
    end if;
    if v_coupon.min_order_amount > 0 and v_subtotal < v_coupon.min_order_amount then
      raise exception 'order subtotal below coupon minimum';
    end if;

    if v_coupon.discount_type = 'percentage' then
      v_discount := round(v_subtotal * (v_coupon.discount_value / 100), 2);
    else
      v_discount := least(v_coupon.discount_value, v_subtotal);
    end if;
  end if;

  -- Delivery fee.
  if p_delivery_method = 'shipping' then
    select value into v_settings
    from public.platform_settings where key = 'shipping';
    if v_settings is not null then
      v_shipping_base := coalesce((v_settings ->> 'base_fee')::numeric, v_shipping_base);
      v_free_shipping_threshold := coalesce((v_settings ->> 'free_above')::numeric, v_free_shipping_threshold);
    end if;

    if (v_subtotal - v_discount) < v_free_shipping_threshold then
      v_shipping := v_shipping_base;
    end if;
  else
    -- Click & collect is paid: standard R60 (7-9 days), express R100 (3-5 days).
    v_shipping := case p_pep_delivery_tier when 'express' then 100 else 60 end;
  end if;

  v_total := v_subtotal - v_discount + v_shipping;

  -- Persist order.
  insert into public.orders (
    user_id, seller_id, payment_method, payment_status,
    subtotal, discount, coupon_id, shipping, total,
    shipping_address, billing_address, notes,
    delivery_method, pep_store_id, pep_delivery_tier
  ) values (
    v_user_id, p_seller_id, p_payment_method,
    case when p_payment_method = 'cod' then 'paid' else 'pending_confirmation' end,
    v_subtotal, v_discount,
    case when p_coupon_code is not null and p_coupon_code <> '' then v_coupon.id else null end,
    v_shipping, v_total,
    p_shipping_address, coalesce(p_billing_address, p_shipping_address), p_notes,
    p_delivery_method,
    case when p_delivery_method = 'pep_collect' then p_pep_store_id else null end,
    case when p_delivery_method = 'pep_collect' then p_pep_delivery_tier else 'standard' end
  ) returning id into v_order_id;

  -- Items + stock.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product from public.products where id = (v_item ->> 'product_id')::uuid;
    v_qty := coalesce((v_item ->> 'quantity')::integer, 0);
    v_unit_price := coalesce(v_product.sale_price, v_product.price);

    insert into public.order_items (
      order_id, product_id, seller_id, product_name, product_image,
      price, quantity, size, colour, line_total
    ) values (
      v_order_id, v_product.id, p_seller_id, v_product.name, v_product.featured_image,
      v_unit_price, v_qty, v_item ->> 'size', v_item ->> 'colour',
      v_unit_price * v_qty
    );

    update public.products
    set stock = stock - v_qty
    where id = v_product.id;
  end loop;

  -- Coupon usage.
  if p_coupon_code is not null and p_coupon_code <> '' then
    update public.coupons set used_count = used_count + 1 where id = v_coupon.id;
  end if;

  -- Commission (skipped entirely when platform commission is turned off).
  select value into v_settings from public.platform_settings where key = 'commission';
  if v_settings is not null then
    v_comm_enabled := coalesce((v_settings ->> 'enabled')::boolean, true);
    v_default_rate := coalesce((v_settings ->> 'rate')::numeric(5,4), 0.08);
  end if;

  if v_comm_enabled then
    select coalesce(s.commission_rate, (select (value ->> 'rate')::numeric(5,4) from public.platform_settings where key = 'commission'))
      into v_commission_rate
    from public.sellers s where s.id = p_seller_id;
    v_commission_rate := coalesce(v_commission_rate, v_default_rate);

    if v_commission_rate > 0 then
      insert into public.commissions (seller_id, order_id, order_number, rate, amount, status)
      values (p_seller_id, v_order_id, null, v_commission_rate, round(v_total * v_commission_rate, 2), 'pending');
    end if;
  end if;

  return (select o from public.orders o where o.id = v_order_id);
end;
$$;

revoke all on function public.place_order(uuid, jsonb, text, jsonb, jsonb, text, text, text, uuid, text) from public;
grant execute on function public.place_order(uuid, jsonb, text, jsonb, jsonb, text, text, text, uuid, text) to authenticated;

-- ---------- 5. begin_payfast_payment(): create a payment session ----------
create or replace function public.begin_payfast_payment(p_order_numbers text[])
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id  uuid := auth.uid();
  v_orders   public.orders[];
  v_total    numeric(12, 2) := 0;
  v_item_count integer := 0;
  v_ref      text;
  v_payment_id bigint;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  if p_order_numbers is null or array_length(p_order_numbers, 1) = 0 then
    raise exception 'no orders to pay';
  end if;

  -- Every order must belong to the caller.
  select array_agg(o order by o.id)
    into v_orders
  from public.orders o
  where o.user_id = v_user_id
    and o.order_number = any(p_order_numbers);

  if v_orders is null or array_length(v_orders, 1) <> array_length(p_order_numbers, 1) then
    raise exception 'one or more orders were not found';
  end if;

  -- All must be fresh PayFast orders (no existing payment session).
  if exists (
    select 1 from unnest(v_orders) o
    where o.payment_method <> 'payfast'
       or o.payment_status <> 'pending_confirmation'
       or o.payfast_ref is not null
  ) then
    raise exception 'order is not awaiting a PayFast payment';
  end if;

  select sum(o.total), count(o.id) into v_total, v_item_count
  from unnest(v_orders) o;

  v_ref := 'PF-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('public.payfast_ref_seq')::text, 6, '0');

  insert into public.payfast_payments (payment_ref, buyer_user_id, amount, item_count)
  values (v_ref, v_user_id, v_total, v_item_count)
  returning id into v_payment_id;

  insert into public.payfast_order_links (payment_id, order_id)
  select v_payment_id, o.id from unnest(v_orders) o;

  update public.orders set payfast_ref = v_ref
  where id in (select o.id from unnest(v_orders) o);

  return v_ref;
end;
$$;

revoke all on function public.begin_payfast_payment(text[]) from public;
grant execute on function public.begin_payfast_payment(text[]) to authenticated;

-- ---------- 6. payfast_redirect_data(): signed PayFast form fields ----------
-- Only public (non-secret) fields plus the md5 signature are returned.
-- The passphrase never leaves the database.
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
  v_name   := left(coalesce(v_cfg.merchant_name, 'CAPPTURE') || ' — order ' || p_payment_ref, 100);
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

  -- md5 over alphabetically sorted key=value pairs (+ passphrase).
  select string_agg(key || '=' || value, '&' order by key) into v_data
  from jsonb_each_text(v_fields);
  if v_cfg.passphrase <> '' then
    v_data := v_data || '&passphrase=' || v_cfg.passphrase;
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

-- ---------- 7. verify_payfast_itn(): recompute & compare the signature ---
-- Used by the payfast-itn edge function so md5 logic stays in one place.
-- The edge function passes the decoded posted params as a jsonb object.
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

  select string_agg(key || '=' || value, '&' order by key) into v_data
  from jsonb_each_text(p_payload);
  if v_cfg.passphrase <> '' then
    v_data := v_data || '&passphrase=' || v_cfg.passphrase;
  end if;

  return md5(v_data) = lower(btrim(p_signature));
end;
$$;

revoke all on function public.verify_payfast_itn(text, jsonb) from public;
grant execute on function public.verify_payfast_itn(text, jsonb) to service_role;

-- ---------- 8. apply_payfast_itn(): settle orders from an ITN ----------
create or replace function public.apply_payfast_itn(
  p_payment_ref  text,
  p_merchant_id  text,
  p_pf_payment_id text,
  p_pf_status    text,
  p_amount_gross numeric,
  p_payload      jsonb default '{}'::jsonb
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pay  public.payfast_payments%rowtype;
  v_cfg  public.payfast_config%rowtype;
  v_order_id uuid;
  v_seller_user_id uuid;
begin
  select * into v_pay from public.payfast_payments where payment_ref = p_payment_ref;
  if not found then return 'MISSING'; end if;

  select * into v_cfg from public.payfast_config where id = 1;
  if not found then return 'NOT_CONFIGURED'; end if;

  if v_cfg.merchant_id <> '' and lower(coalesce(p_merchant_id, '')) <> lower(v_cfg.merchant_id) then
    return 'MERCHANT_MISMATCH';
  end if;

  if v_pay.status = 'complete' then
    return 'ALREADY_PAID';
  end if;

  update public.payfast_payments
  set pf_payment_id  = coalesce(p_pf_payment_id, pf_payment_id),
      payfast_status = upper(coalesce(p_pf_status, '')),
      itn_payload    = coalesce(p_payload, itn_payload),
      updated_at     = now()
  where id = v_pay.id;

  if upper(coalesce(p_pf_status, '')) = 'COMPLETE' then
    if round(coalesce(p_amount_gross, 0), 2) <> round(v_pay.amount, 2) then
      return 'AMOUNT_MISMATCH';
    end if;

    update public.payfast_payments set status = 'complete' where id = v_pay.id;

    for v_order_id in
      select o.id from public.orders o
      join public.payfast_order_links l on l.order_id = o.id
      where l.payment_id = v_pay.id
    loop
      update public.orders o set payment_status = 'paid'
      where o.id = v_order_id and o.payment_status <> 'paid';

      select s.user_id into v_seller_user_id
      from public.orders o
      join public.sellers s on s.id = o.seller_id
      where o.id = v_order_id;

      if v_seller_user_id is not null then
        perform public.notify_user(
          v_seller_user_id, 'order_payment',
          'Order paid',
          format('Order %s has been paid and is ready to fulfil.', (select order_number from public.orders where id = v_order_id)),
          jsonb_build_object('order_id', v_order_id)
        );
      end if;
    end loop;

    perform public.notify_user(
      v_pay.buyer_user_id, 'order_payment',
      'Payment received',
      format('Your PayFast payment of %s for %s was received successfully.',
             to_char(v_pay.amount, 'FM999999999990.00'), p_payment_ref)
    );

    return 'OK';
  end if;

  if upper(coalesce(p_pf_status, '')) in ('CANCELLED', 'FAILED') then
    update public.payfast_payments set status = 'failed' where id = v_pay.id;

    update public.orders o set payment_status = 'failed'
    from public.payfast_order_links l
    where l.payment_id = v_pay.id
      and l.order_id = o.id
      and o.payment_status <> 'paid';

    return 'OK';
  end if;

  return 'PENDING';
end;
$$;

revoke all on function public.apply_payfast_itn(text, text, text, text, numeric, jsonb) from public;
grant execute on function public.apply_payfast_itn(text, text, text, text, numeric, jsonb) to service_role;

-- ---------- 9. Admin config RPCs ----------
create or replace function public.set_payfast_config(
  p_merchant_id   text default null,
  p_merchant_key  text default null,
  p_passphrase    text default null,
  p_sandbox       boolean default true,
  p_merchant_name text default null,
  p_return_url    text default null,
  p_cancel_url    text default null,
  p_notify_url    text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  insert into public.payfast_config (id) values (1)
  on conflict (id) do nothing;

  update public.payfast_config set
    merchant_id   = coalesce(nullif(p_merchant_id, ''), merchant_id),
    merchant_key  = coalesce(nullif(p_merchant_key, ''), merchant_key),
    passphrase    = coalesce(nullif(p_passphrase, ''), passphrase),
    sandbox       = coalesce(p_sandbox, sandbox),
    merchant_name = coalesce(nullif(p_merchant_name, ''), merchant_name),
    return_url    = coalesce(nullif(p_return_url, ''), return_url),
    cancel_url    = coalesce(nullif(p_cancel_url, ''), cancel_url),
    notify_url    = coalesce(nullif(p_notify_url, ''), notify_url),
    updated_at    = now()
  where id = 1;
end;
$$;

create or replace function public.get_payfast_config_admin()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cfg public.payfast_config%rowtype;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  select * into v_cfg from public.payfast_config where id = 1;
  if not found then
    return jsonb_build_object('configured', false);
  end if;

  return jsonb_build_object(
    'configured',      true,
    'merchant_id',     v_cfg.merchant_id,
    'merchant_key_set', v_cfg.merchant_key <> '',
    'passphrase_set',  v_cfg.passphrase <> '',
    'sandbox',         v_cfg.sandbox,
    'merchant_name',   v_cfg.merchant_name,
    'return_url',      v_cfg.return_url,
    'cancel_url',      v_cfg.cancel_url,
    'notify_url',      v_cfg.notify_url
  );
end;
$$;

revoke all on function public.set_payfast_config(text, text, text, boolean, text, text, text, text) from public;
grant execute on function public.set_payfast_config(text, text, text, boolean, text, text, text, text) to authenticated;

revoke all on function public.get_payfast_config_admin() from public;
grant execute on function public.get_payfast_config_admin() to authenticated;