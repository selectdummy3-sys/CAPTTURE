-- ============================================================
-- CAPPTURE — PEP Click & Collect delivery method
-- Adds the pep_stores location table, order delivery metadata,
-- and extends place_order to support collection at a PEP store.
-- Seed data lives in supabase/seed/pep_stores.sql (apply after this).
-- ============================================================

-- ---------- pep_stores ----------
create table public.pep_stores (
  id           uuid primary key default gen_random_uuid(),
  store_code   text not null unique,
  store_name   text not null,
  province     text not null,
  city         text not null,
  address_line text not null default '',
  raw_address  text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index pep_stores_province_idx on public.pep_stores (province);
create index pep_stores_city_idx on public.pep_stores (city);

create trigger pep_stores_updated_at
  before update on public.pep_stores
  for each row execute procedure public.handle_updated_at();

alter table public.pep_stores enable row level security;

create policy "pep_stores_select_public"
  on public.pep_stores for select
  using (true);

-- ---------- orders: delivery method ----------
alter table public.orders
  add column delivery_method text not null default 'shipping'
    check (delivery_method in ('shipping', 'pep_collect'));

alter table public.orders
  add column pep_store_id uuid references public.pep_stores (id) on delete set null;

create index orders_pep_store_idx on public.orders (pep_store_id);

-- ---------- place_order(): support PEP Click & Collect ----------
create or replace function public.place_order(
  p_seller_id       uuid,
  p_items           jsonb,
  p_payment_method  text,
  p_shipping_address jsonb,
  p_billing_address jsonb default null,
  p_notes           text default null,
  p_coupon_code     text default null,
  p_delivery_method text default 'shipping',
  p_pep_store_id    uuid default null
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

  if p_delivery_method not in ('shipping', 'pep_collect') then
    raise exception 'unsupported delivery method';
  end if;

  if p_delivery_method = 'pep_collect' and p_pep_store_id is null then
    raise exception 'a PEP store must be selected for click & collect';
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

  -- Shipping only applies to home delivery. Click & collect is free.
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
    v_shipping := 0;
  end if;

  v_total := v_subtotal - v_discount + v_shipping;

  -- Persist order.
  insert into public.orders (
    user_id, seller_id, payment_method, payment_status,
    subtotal, discount, coupon_id, shipping, total,
    shipping_address, billing_address, notes,
    delivery_method, pep_store_id
  ) values (
    v_user_id, p_seller_id, p_payment_method,
    case when p_payment_method = 'cod' then 'paid' else 'pending_confirmation' end,
    v_subtotal, v_discount,
    case when p_coupon_code is not null and p_coupon_code <> '' then v_coupon.id else null end,
    v_shipping, v_total,
    p_shipping_address, coalesce(p_billing_address, p_shipping_address), p_notes,
    p_delivery_method,
    case when p_delivery_method = 'pep_collect' then p_pep_store_id else null end
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

revoke all on function public.place_order(uuid, jsonb, text, jsonb, jsonb, text, text, text, uuid) from public;
grant execute on function public.place_order(uuid, jsonb, text, jsonb, jsonb, text, text, text, uuid) to authenticated;
