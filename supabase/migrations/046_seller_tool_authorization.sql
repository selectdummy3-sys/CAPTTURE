-- 046_seller_tool_authorization.sql
-- Enforce approved-seller-only access to seller tools on the backend.
--
-- Previously most seller analytics/earnings RPCs accepted an arbitrary
-- p_seller_id with no authorization check (an IDOR): any authenticated user
-- could read any seller's revenue, visits, conversion rate, or earnings just
-- by guessing a seller id. Several other RPCs only required "a seller row" of
-- ANY status (pending/rejected/suspended) instead of an approved seller.
--
-- Fixes in this migration:
--   * Analytics dashboards require p_seller_id = current approved seller.
--   * get_seller_user_id only resolves the caller's own seller id (else admin).
--   * seller_balance() resolves only for an approved seller.
--   * update_my_seller_profile() requires an approved seller.
--   * Supplies (B2B catalogue + orders) are now approved-seller-only.
--
-- NOTE: This tightens the documented 027 behaviour ("supplies open to all
-- registered sellers, any status") per the product decision that suspended /
-- rejected sellers must not have access to active seller tools.

begin;

-- ------------------------------------------------------------------
-- 1. Analytics RPCs (current approved seller only)
-- ------------------------------------------------------------------

create or replace function public.get_seller_daily_sales(
  p_seller_id uuid,
  p_days int default 30
)
returns table(date text, value numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_seller_id is distinct from public.current_seller() then
    raise exception 'forbidden: not your store';
  end if;

  return query
    select
      to_char(series_date, 'YYYY-MM-DD')::text as date,
      coalesce(sum(o.total), 0)::numeric as value
    from generate_series(
      (now() - interval '1 day' * p_days)::date,
      now()::date,
      interval '1 day'
    ) as series_date
    left join public.orders o
      on o.seller_id = p_seller_id
      and o.created_at::date = series_date
      and o.status in ('paid', 'processing', 'shipped', 'delivered')
    group by series_date
    order by series_date;
end;
$$;

create or replace function public.get_seller_weekly_sales(
  p_seller_id uuid,
  p_weeks int default 12
)
returns table(date text, value numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_seller_id is distinct from public.current_seller() then
    raise exception 'forbidden: not your store';
  end if;

  return query
    select
      to_char(week_start, 'YYYY-"W"IW')::text as date,
      coalesce(sum(o.total), 0)::numeric as value
    from generate_series(
      date_trunc('week', (now() - interval '1 week' * p_weeks))::date,
      date_trunc('week', now())::date,
      interval '1 week'
    ) as week_start
    left join public.orders o
      on o.seller_id = p_seller_id
      and o.created_at >= week_start
      and o.created_at < week_start + interval '1 week'
      and o.status in ('paid', 'processing', 'shipped', 'delivered')
    group by week_start
    order by week_start;
end;
$$;

create or replace function public.get_seller_monthly_sales(
  p_seller_id uuid,
  p_months int default 12
)
returns table(date text, value numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_seller_id is distinct from public.current_seller() then
    raise exception 'forbidden: not your store';
  end if;

  return query
    select
      to_char(month_start, 'YYYY-MM')::text as date,
      coalesce(sum(o.total), 0)::numeric as value
    from generate_series(
      date_trunc('month', (now() - interval '1 month' * p_months))::date,
      date_trunc('month', now())::date,
      interval '1 month'
    ) as month_start
    left join public.orders o
      on o.seller_id = p_seller_id
      and o.created_at >= month_start
      and o.created_at < month_start + interval '1 month'
      and o.status in ('paid', 'processing', 'shipped', 'delivered')
    group by month_start
    order by month_start;
end;
$$;

create or replace function public.get_seller_revenue_over_time(
  p_seller_id uuid,
  p_days int default 90
)
returns table(date text, value numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_seller_id is distinct from public.current_seller() then
    raise exception 'forbidden: not your store';
  end if;

  return query
    select
      to_char(series_date, 'YYYY-MM-DD')::text as date,
      coalesce(sum(o.total), 0)::numeric as value
    from generate_series(
      (now() - interval '1 day' * p_days)::date,
      now()::date,
      interval '1 day'
    ) as series_date
    left join public.orders o
      on o.seller_id = p_seller_id
      and o.created_at::date = series_date
      and o.status in ('delivered', 'shipped', 'processing', 'paid')
    group by series_date
    order by series_date;
end;
$$;

create or replace function public.get_seller_orders_over_time(
  p_seller_id uuid,
  p_days int default 90
)
returns table(date text, value numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_seller_id is distinct from public.current_seller() then
    raise exception 'forbidden: not your store';
  end if;

  return query
    select
      to_char(series_date, 'YYYY-MM-DD')::text as date,
      count(o.id)::numeric as value
    from generate_series(
      (now() - interval '1 day' * p_days)::date,
      now()::date,
      interval '1 day'
    ) as series_date
    left join public.orders o
      on o.seller_id = p_seller_id
      and o.created_at::date = series_date
    group by series_date
    order by series_date;
end;
$$;

create or replace function public.get_seller_best_selling_products(
  p_seller_id uuid,
  p_limit int default 10
)
returns table(id uuid, name text, sales int, revenue numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_seller_id is distinct from public.current_seller() then
    raise exception 'forbidden: not your store';
  end if;

  return query
    select
      p.id,
      p.name,
      count(oi.id)::int as sales,
      sum(oi.price * oi.quantity)::numeric as revenue
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    join public.products p on p.id = oi.product_id
    where p.seller_id = p_seller_id
      and o.status in ('paid', 'processing', 'shipped', 'delivered')
    group by p.id, p.name
    order by sales desc
    limit p_limit;
end;
$$;

create or replace function public.get_seller_follower_growth(
  p_seller_id uuid,
  p_days int default 90
)
returns table(date text, value numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_seller_id is distinct from public.current_seller() then
    raise exception 'forbidden: not your store';
  end if;

  return query
    select
      to_char(series_date, 'YYYY-MM-DD')::text as date,
      count(sf.id)::numeric as value
    from generate_series(
      (now() - interval '1 day' * p_days)::date,
      now()::date,
      interval '1 day'
    ) as series_date
    left join public.store_followers sf
      on sf.seller_id = p_seller_id
      and sf.created_at::date = series_date
    group by series_date
    order by series_date;
end;
$$;

-- Real-event versions (028) also gated.
create or replace function public.get_seller_store_visits(
  p_seller_id uuid,
  p_days int default 30
)
returns table(date text, value numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_seller_id is distinct from public.current_seller() then
    raise exception 'forbidden: not your store';
  end if;

  return query
    select
      to_char(series_date, 'YYYY-MM-DD')::text as date,
      coalesce(count(sv.id), 0)::numeric as value
    from generate_series(
      (now() - interval '1 day' * p_days)::date,
      now()::date,
      interval '1 day'
    ) as series_date
    left join public.store_visits sv
      on sv.seller_id = p_seller_id
      and sv.created_at::date = series_date
    group by series_date
    order by series_date;
end;
$$;

create or replace function public.get_seller_product_views(
  p_seller_id uuid,
  p_days int default 30
)
returns table(date text, value numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_seller_id is distinct from public.current_seller() then
    raise exception 'forbidden: not your store';
  end if;

  return query
    select
      to_char(series_date, 'YYYY-MM-DD')::text as date,
      coalesce(count(pve.id), 0)::numeric as value
    from generate_series(
      (now() - interval '1 day' * p_days)::date,
      now()::date,
      interval '1 day'
    ) as series_date
    left join public.product_view_events pve
      on pve.created_at::date = series_date
      and pve.product_id in (
        select id from public.products where seller_id = p_seller_id
      )
    group by series_date
    order by series_date;
end;
$$;

create or replace function public.get_seller_conversion_rate(
  p_seller_id uuid,
  p_days int default 30
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_orders int;
  v_visits int;
begin
  if p_seller_id is distinct from public.current_seller() then
    raise exception 'forbidden: not your store';
  end if;

  select count(*) into v_orders
  from public.orders
  where seller_id = p_seller_id
    and created_at >= now() - interval '1 day' * p_days;

  select count(*) into v_visits
  from public.store_visits
  where seller_id = p_seller_id
    and created_at >= now() - interval '1 day' * p_days;

  if v_visits = 0 then
    return 0;
  end if;

  return round((v_orders::numeric / v_visits) * 100, 2);
end;
$$;

-- Earnings summary: the canonical version (035) now gated.
create or replace function public.get_seller_earnings(p_seller_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_available  numeric;
  v_pending    numeric;
  v_total      numeric;
  v_commission numeric;
  v_next_payout timestamptz;
begin
  if p_seller_id is distinct from public.current_seller() then
    raise exception 'forbidden: not your store';
  end if;

  with order_net as (
    select o.status,
           o.total - coalesce((select sum(c.amount) from public.commissions c where c.order_id = o.id), 0) as net
    from public.orders o
    where o.seller_id = p_seller_id
  ),
  available as (
    select coalesce(sum(net), 0) as v from order_net where status = 'delivered'
  ),
  pending as (
    select coalesce(sum(net), 0) as v from order_net where status in ('pending', 'paid', 'processing', 'shipped')
  ),
  total as (
    select coalesce(sum(net), 0) as v from order_net where status in ('pending', 'paid', 'processing', 'shipped', 'delivered')
  ),
  commissions as (
    select coalesce(sum(c.amount), 0) as v
    from public.commissions c
    join public.orders o on o.id = c.order_id
    where o.seller_id = p_seller_id
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
  select a.v - wd.v + ws.v, p.v, t.v, c.v
    into v_available, v_pending, v_total, v_commission
  from available a, pending p, total t, commissions c, withdrawals_done wd, wallet_spend ws;

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
$function$;

-- ------------------------------------------------------------------
-- 2. get_seller_user_id: only resolve caller's own seller (or admin).
-- ------------------------------------------------------------------
create or replace function public.get_seller_user_id(p_seller_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if not public.is_admin() and p_seller_id is distinct from public.current_seller() then
    raise exception 'forbidden';
  end if;

  select user_id into v_user_id from public.sellers where id = p_seller_id;
  return v_user_id;
end;
$$;

-- ------------------------------------------------------------------
-- 3. seller_balance(): approved seller only (suspended/rejected -> null).
-- ------------------------------------------------------------------
create or replace function public.seller_balance()
returns numeric
language sql
stable
security definer
set search_path to 'public'
as $function$
  with caller_seller as (
    select id from public.sellers
    where user_id = auth.uid() and application_status = 'approved'
    limit 1
  ),
  order_net as (
    select o.total - coalesce((select sum(c.amount) from public.commissions c where c.order_id = o.id), 0) as net
    from public.orders o
    cross join caller_seller s
    where o.seller_id = s.id
      and o.status = 'delivered'
  ),
  available as (
    select coalesce(sum(net), 0) as total_net from order_net
  ),
  withdrawals_done as (
    select coalesce(sum(w.amount), 0) as total_withdrawn
    from public.withdrawal_requests w
    cross join caller_seller s
    where w.seller_id = s.id
      and w.status in ('approved', 'paid')
  ),
  wallet_spend as (
    select coalesce(sum(wt.amount), 0) as total_spend
    from public.wallet_transactions wt
    cross join caller_seller s
    where wt.seller_id = s.id
  )
  select
    a.total_net - w.total_withdrawn + s.total_spend
  from available a, withdrawals_done w, wallet_spend s;
$function$;

-- ------------------------------------------------------------------
-- 4. update_my_seller_profile(): approved seller only.
-- ------------------------------------------------------------------
create or replace function public.update_my_seller_profile(
  p_business_name text,
  p_description text default null,
  p_province text default null,
  p_phone text default null,
  p_email text default null,
  p_logo_url text default null,
  p_banner_url text default null,
  p_social_links jsonb default '{}'::jsonb,
  p_bank_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid;
begin
  select id into v_seller_id
    from public.sellers
    where user_id = auth.uid() and application_status = 'approved';

  if v_seller_id is null then
    raise exception 'Approved seller account required';
  end if;

  update public.sellers set
    business_name = p_business_name,
    description    = coalesce(p_description, description),
    province       = coalesce(p_province, province),
    phone          = coalesce(p_phone, phone),
    email          = coalesce(p_email, email),
    logo_url       = coalesce(p_logo_url, logo_url),
    banner_url     = coalesce(p_banner_url, banner_url),
    social_links   = coalesce(p_social_links, social_links),
    bank_details   = coalesce(p_bank_details, bank_details)
  where id = v_seller_id;
end;
$$;

revoke all on function public.update_my_seller_profile(text, text, text, text, text, text, text, jsonb, jsonb)
  from public;

grant execute on function public.update_my_seller_profile(text, text, text, text, text, text, text, jsonb, jsonb)
  to authenticated;

-- ------------------------------------------------------------------
-- 5. Supplies: approved sellers only.
-- ------------------------------------------------------------------
create or replace function public.is_seller_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.sellers
    where user_id = auth.uid() and application_status = 'approved'
  );
$$;

create or replace function public.place_supply_order(
  p_items            jsonb,
  p_shipping_address jsonb,
  p_courier_id       uuid,
  p_payment_method   text default 'online',
  p_notes            text default null
)
returns public.supply_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id     uuid;
  v_item          jsonb;
  v_product       public.supply_products%rowtype;
  v_courier       public.supply_couriers%rowtype;
  v_qty           integer;
  v_unit_price    numeric(12, 2);
  v_subtotal      numeric(12, 2) := 0;
  v_delivery_fee  numeric(12, 2) := 0;
  v_has_physical  boolean := false;
  v_order_id      uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select id into v_seller_id
  from public.sellers
  where user_id = auth.uid() and application_status = 'approved'
  limit 1;
  if not found then
    raise exception 'approved seller account required';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'order has no items';
  end if;

  if p_payment_method not in ('online', 'eft') then
    raise exception 'unsupported payment method';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product
    from public.supply_products
    where id = (v_item ->> 'product_id')::uuid
    for update;

    if not found then
      raise exception 'product not found';
    end if;
    if not v_product.is_active then
      raise exception 'product "%" is not available', v_product.name;
    end if;

    v_qty := coalesce((v_item ->> 'quantity')::integer, 0);
    if v_qty < 1 then
      raise exception 'invalid quantity';
    end if;

    if v_product.type = 'physical' then
      v_has_physical := true;
      if v_product.stock is null or v_product.stock < v_qty then
        raise exception 'only % left in stock for "%"', coalesce(v_product.stock, 0), v_product.name;
      end if;
    end if;

    v_unit_price := coalesce(v_product.sale_price, v_product.price);
    v_subtotal   := v_subtotal + (v_unit_price * v_qty);
  end loop;

  if v_has_physical then
    select * into v_courier
    from public.supply_couriers
    where id = p_courier_id and is_active = true;
    if not found then
      raise exception 'courier is not available';
    end if;
    v_delivery_fee := v_courier.fee;
  end if;

  insert into public.supply_orders (
    seller_id, payment_method, payment_status, subtotal, delivery_fee, total,
    courier, shipping_address, notes
  ) values (
    v_seller_id, p_payment_method,
    case when p_payment_method = 'online' then 'paid' else 'pending_confirmation' end,
    v_subtotal, v_delivery_fee, v_subtotal + v_delivery_fee,
    case when v_has_physical then v_courier.name else null end,
    coalesce(p_shipping_address, '{}'::jsonb), p_notes
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product from public.supply_products where id = (v_item ->> 'product_id')::uuid;
    v_qty        := coalesce((v_item ->> 'quantity')::integer, 0);
    v_unit_price := coalesce(v_product.sale_price, v_product.price);

    insert into public.supply_order_items (
      order_id, product_id, product_name, product_image, price, quantity, line_total
    ) values (
      v_order_id, v_product.id, v_product.name, v_product.featured_image,
      v_unit_price, v_qty, v_unit_price * v_qty
    );

    if v_product.type = 'physical' then
      update public.supply_products set stock = stock - v_qty where id = v_product.id;
    end if;
  end loop;

  return (select s from public.supply_orders s where s.id = v_order_id);
end;
$$;

revoke all on function public.place_supply_order(jsonb, jsonb, uuid, text, text) from public;
grant execute on function public.place_supply_order(jsonb, jsonb, uuid, text, text) to authenticated;

drop policy if exists "supply_orders_select_own" on public.supply_orders;
create policy "supply_orders_select_own" on public.supply_orders for select
  using (
    public.current_seller() is not null
    and seller_id = public.current_seller()
  );

drop policy if exists "supply_orders_insert_own" on public.supply_orders;
create policy "supply_orders_insert_own" on public.supply_orders for insert
  with check (
    public.current_seller() is not null
    and seller_id = public.current_seller()
  );

drop policy if exists "supply_order_items_select_own" on public.supply_order_items;
create policy "supply_order_items_select_own" on public.supply_order_items for select
  using (
    exists (
      select 1 from public.supply_orders o
      where o.id = supply_order_items.order_id
        and public.current_seller() is not null
        and o.seller_id = public.current_seller()
    )
  );

commit;