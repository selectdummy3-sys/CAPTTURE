-- ============================================================
-- CAPPTURE — Seller wallet purchases + commission settings
-- ============================================================
-- 1. wallet_transactions ledger (purchase debits / refund credits).
--    The available-balance formula stays derived but now subtracts
--    net wallet spend, so existing seller balances are unchanged.
-- 2. pay_with_balance RPC: approved sellers can pay from their
--    dashboard balance (no payment gateway involved).
-- 3. Refund/cancel of a wallet-paid order re-credits the buyer.
-- 4. Commission settings: platform_settings['commission'] gains an
--    "enabled" flag + editable "rate"; place_order respects both.
-- 5. Admin RPCs: set_commission_settings + admin_commission_stats.

-- ---------- 1. wallet_transactions ----------
create table if not exists public.wallet_transactions (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references public.sellers (id) on delete cascade,
  type        text not null check (type in ('purchase', 'refund')),
  amount      numeric(12, 2) not null, -- purchase = negative (debit), refund = positive (credit)
  order_id    uuid references public.orders (id) on delete set null,
  reference   text,
  description text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_wallet_tx_seller on public.wallet_transactions (seller_id, created_at desc);

alter table public.wallet_transactions enable row level security;

-- Sellers can read their own transactions.
create policy "wallet_transactions_read_seller"
  on public.wallet_transactions for select
  using (public.current_seller() is not null and seller_id = public.current_seller());

-- Admins can read all.
create policy "wallet_transactions_read_admin"
  on public.wallet_transactions for select
  using (public.is_admin());

comment on table public.wallet_transactions is 'Seller wallet ledger: purchase debits and refund credits';

-- ---------- 2. orders.payment_method now allows 'wallet' ----------
alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders
  add constraint orders_payment_method_check
  check (payment_method in ('cod', 'eft', 'wallet'));

-- ---------- 3. seller_balance(): subtract net wallet spend ----------
create or replace function public.seller_balance()
returns numeric(12, 2)
language sql
security definer
set search_path = public
stable
as $$
  with earnings as (
    select coalesce(sum(o.total), 0) as total_orders
    from public.orders o
    where o.seller_id = (select id from public.sellers where user_id = auth.uid())
      and o.status = 'delivered'
  ),
  commissions_paid as (
    select coalesce(sum(c.amount), 0) as total_commissions
    from public.commissions c
    where c.seller_id = (select id from public.sellers where user_id = auth.uid())
      and c.status = 'paid'
  ),
  withdrawals_done as (
    select coalesce(sum(w.amount), 0) as total_withdrawn
    from public.withdrawal_requests w
    where w.seller_id = (select id from public.sellers where user_id = auth.uid())
      and w.status in ('approved', 'paid')
  ),
  wallet_spend as (
    select coalesce(sum(wt.amount), 0) as total_spend
    from public.wallet_transactions wt
    where wt.seller_id = (select id from public.sellers where user_id = auth.uid())
  )
  select
    e.total_orders - c.total_commissions - w.total_withdrawn + s.total_spend
  from earnings e, commissions_paid c, withdrawals_done w, wallet_spend s;
$$;

-- ---------- 4. get_seller_earnings(): availableBalance uses wallet spend ----------
create or replace function public.get_seller_earnings(
  p_seller_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_available numeric;
  v_pending numeric;
  v_total numeric;
  v_commission numeric;
  v_next_payout timestamptz;
begin
  with earnings as (
    select coalesce(sum(o.total), 0) as v
    from public.orders o
    where o.seller_id = p_seller_id and o.status = 'delivered'
  ),
  commissions_paid as (
    select coalesce(sum(c.amount), 0) as v
    from public.commissions c
    where c.seller_id = p_seller_id and c.status = 'paid'
  ),
  withdrawals_done as (
    select coalesce(sum(w.amount), 0) as v
    from public.withdrawal_requests w
    where w.seller_id = p_seller_id and w.status in ('approved', 'paid')
  ),
  wallet_spend as (
    select coalesce(sum(wt.amount), 0) as v
    from public.wallet_transactions wt
    where wt.seller_id = p_seller_id
  )
  select e.v - c.v - w.v + s.v into v_available
  from earnings e, commissions_paid c, withdrawals_done w, wallet_spend s;

  select coalesce(sum(o.total), 0) into v_pending
  from public.orders o
  where o.seller_id = p_seller_id and o.status in ('paid', 'processing', 'shipped');

  select coalesce(sum(o.total), 0) into v_total
  from public.orders o
  where o.seller_id = p_seller_id and o.status in ('delivered', 'shipped', 'processing', 'paid');

  select coalesce(sum(c.amount), 0) into v_commission
  from public.commissions c
  join public.orders o on o.id = c.order_id
  where o.seller_id = p_seller_id;

  select min(wr.created_at + interval '5 days') into v_next_payout
  from public.withdrawal_requests wr
  where wr.seller_id = p_seller_id and wr.status in ('pending', 'approved');

  return jsonb_build_object(
    'availableBalance', v_available,
    'pendingBalance', v_pending,
    'totalEarnings', v_total,
    'marketplaceCommission', v_commission,
    'nextPayoutDate', v_next_payout
  );
end;
$$;

grant execute on function public.seller_balance() to authenticated;
grant execute on function public.get_seller_earnings(uuid) to authenticated;

-- ---------- 5. place_order(): respect commission enabled/rate ----------
create or replace function public.place_order(
  p_seller_id       uuid,
  p_items           jsonb,
  p_payment_method  text,
  p_shipping_address jsonb,
  p_billing_address jsonb default null,
  p_notes           text default null,
  p_coupon_code     text default null
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

  if p_payment_method not in ('cod', 'eft') then
    raise exception 'unsupported payment method';
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

  -- Shipping rules from platform settings.
  select value into v_settings
  from public.platform_settings where key = 'shipping';
  if v_settings is not null then
    v_shipping_base := coalesce((v_settings ->> 'base_fee')::numeric, v_shipping_base);
    v_free_shipping_threshold := coalesce((v_settings ->> 'free_above')::numeric, v_free_shipping_threshold);
  end if;

  if (v_subtotal - v_discount) < v_free_shipping_threshold then
    v_shipping := v_shipping_base;
  end if;

  v_total := v_subtotal - v_discount + v_shipping;

  -- Persist order.
  insert into public.orders (
    user_id, seller_id, payment_method, payment_status,
    subtotal, discount, coupon_id, shipping, total,
    shipping_address, billing_address, notes
  ) values (
    v_user_id, p_seller_id, p_payment_method,
    case when p_payment_method = 'cod' then 'paid' else 'pending_confirmation' end,
    v_subtotal, v_discount,
    case when p_coupon_code is not null and p_coupon_code <> '' then v_coupon.id else null end,
    v_shipping, v_total,
    p_shipping_address, coalesce(p_billing_address, p_shipping_address), p_notes
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

revoke all on function public.place_order(uuid, jsonb, text, jsonb, jsonb, text, text) from public;
grant execute on function public.place_order(uuid, jsonb, text, jsonb, jsonb, text, text) to authenticated;

-- ---------- 6. pay_with_balance ----------
create or replace function public.pay_with_balance(
  p_seller_id        uuid,
  p_items            jsonb,
  p_shipping_address jsonb,
  p_billing_address  jsonb default null,
  p_notes            text default null,
  p_coupon_code      text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer_id       uuid := auth.uid();
  v_buyer_seller   uuid;
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
  v_balance        numeric(12, 2);
  v_commission_rate numeric(5, 4);
  v_free_shipping_threshold numeric(12, 2) := 100000;
  v_shipping_base  numeric(12, 2) := 60;
  v_settings       jsonb;
  v_comm_enabled   boolean := true;
  v_default_rate   numeric(5, 4) := 0.08;
begin
  if v_buyer_id is null then
    raise exception 'authentication required';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'order has no items';
  end if;

  -- Buyer must be an approved seller; lock their row to serialize
  -- concurrent wallet purchases and prevent double-spending.
  select id into v_buyer_seller
  from public.sellers
  where user_id = v_buyer_id and application_status = 'approved'
  for update;
  if not found then
    raise exception 'wallet payments require an approved seller account';
  end if;

  -- Sellers may not pay themselves from their own wallet.
  if p_seller_id = v_buyer_seller then
    raise exception 'cannot buy from your own store';
  end if;

  -- Receiving seller must be approved.
  perform 1 from public.sellers
  where id = p_seller_id and application_status = 'approved';
  if not found then
    raise exception 'seller is not active';
  end if;

  -- Validate items, lock products, snapshot prices.
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

  -- Coupon validation.
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

  -- Shipping rules.
  select value into v_settings from public.platform_settings where key = 'shipping';
  if v_settings is not null then
    v_shipping_base := coalesce((v_settings ->> 'base_fee')::numeric, v_shipping_base);
    v_free_shipping_threshold := coalesce((v_settings ->> 'free_above')::numeric, v_free_shipping_threshold);
  end if;

  if (v_subtotal - v_discount) < v_free_shipping_threshold then
    v_shipping := v_shipping_base;
  end if;

  v_total := v_subtotal - v_discount + v_shipping;

  -- Available balance check (same formula as seller_balance()).
  with earnings as (
    select coalesce(sum(o.total), 0) as v
    from public.orders o
    where o.seller_id = v_buyer_seller and o.status = 'delivered'
  ),
  commissions_paid as (
    select coalesce(sum(c.amount), 0) as v
    from public.commissions c
    where c.seller_id = v_buyer_seller and c.status = 'paid'
  ),
  withdrawals_done as (
    select coalesce(sum(w.amount), 0) as v
    from public.withdrawal_requests w
    where w.seller_id = v_buyer_seller and w.status in ('approved', 'paid')
  ),
  wallet_spend as (
    select coalesce(sum(wt.amount), 0) as v
    from public.wallet_transactions wt
    where wt.seller_id = v_buyer_seller
  )
  select e.v - c.v - w.v + s.v into v_balance
  from earnings e, commissions_paid c, withdrawals_done w, wallet_spend s;

  if v_balance < v_total then
    raise exception 'insufficient wallet balance (available R%, total R%)', v_balance, v_total;
  end if;

  -- Persist order as immediately paid.
  insert into public.orders (
    user_id, seller_id, payment_method, payment_status, status,
    subtotal, discount, coupon_id, shipping, total,
    shipping_address, billing_address, notes
  ) values (
    v_buyer_id, p_seller_id, 'wallet', 'paid', 'paid',
    v_subtotal, v_discount,
    case when p_coupon_code is not null and p_coupon_code <> '' then v_coupon.id else null end,
    v_shipping, v_total,
    p_shipping_address, coalesce(p_billing_address, p_shipping_address), p_notes
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

  -- Commission (respects platform toggle).
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

  -- Debit the buyer's wallet (negative amount).
  insert into public.wallet_transactions (seller_id, type, amount, order_id, reference, description)
  values (v_buyer_seller, 'purchase', -v_total, v_order_id,
          (select order_number from public.orders where id = v_order_id),
          'Purchase paid from wallet balance');

  return (select o from public.orders o where o.id = v_order_id);
end;
$$;

revoke all on function public.pay_with_balance(uuid, jsonb, jsonb, jsonb, text, text) from public;
grant execute on function public.pay_with_balance(uuid, jsonb, jsonb, jsonb, text, text) to authenticated;

-- ---------- 7. Refund/cancel re-credits the buyer's wallet ----------
create or replace function public.refund_wallet_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid;
begin
  if new.payment_method = 'wallet'
     and new.payment_status = 'paid'
     and new.status in ('cancelled', 'refunded')
     and old.status not in ('cancelled', 'refunded')
     and not exists (
       select 1 from public.wallet_transactions wt
       where wt.order_id = new.id and wt.type = 'refund'
     )
  then
    select id into v_seller_id from public.sellers where user_id = new.user_id;
    if v_seller_id is not null then
      insert into public.wallet_transactions (seller_id, type, amount, order_id, reference, description)
      values (v_seller_id, 'refund', new.total, new.id, new.order_number,
              'Refund for order ' || new.order_number);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_refund_wallet on public.orders;
create trigger orders_refund_wallet
  after update of status on public.orders
  for each row execute procedure public.refund_wallet_order();

-- ---------- 8. Commission settings (admin) ----------
-- Seed the enabled flag on the existing commission settings row.
insert into public.platform_settings (key, value)
values ('commission', '{"rate": 0.08, "enabled": true}')
on conflict (key) do update
  set value = public.platform_settings.value || '{"enabled": true}'
  where not (public.platform_settings.value ? 'enabled');

create or replace function public.set_commission_settings(
  p_rate    numeric(5, 4),
  p_enabled boolean
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
  if p_rate is null or p_rate < 0 or p_rate > 0.5 then
    raise exception 'commission rate must be between 0 and 50 percent';
  end if;

  insert into public.platform_settings (key, value)
  values ('commission', jsonb_build_object('rate', p_rate, 'enabled', p_enabled))
  on conflict (key) do update
    set value = jsonb_build_object('rate', p_rate, 'enabled', p_enabled);
end;
$$;

create or replace function public.admin_commission_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_total     numeric;
  v_collected numeric;
  v_pending   numeric;
  v_count     bigint;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  select coalesce(sum(c.amount), 0),
         coalesce(sum(c.amount) filter (where c.status = 'paid'), 0),
         coalesce(sum(c.amount) filter (where c.status = 'pending'), 0),
         count(c.id)
    into v_total, v_collected, v_pending, v_count
  from public.commissions c;

  return jsonb_build_object(
    'total', v_total,
    'collected', v_collected,
    'pending', v_pending,
    'count', v_count
  );
end;
$$;

revoke all on function public.set_commission_settings(numeric, boolean) from public;
revoke all on function public.admin_commission_stats() from public;
grant execute on function public.set_commission_settings(numeric, boolean) to authenticated;
grant execute on function public.admin_commission_stats() to authenticated;

-- ---------- 9. wallet_transactions read access ----------
grant select on public.wallet_transactions to authenticated;
