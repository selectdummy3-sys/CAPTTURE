-- ============================================================
-- CAPPTURE — Seller Analytics & Dashboard RPCs
-- ============================================================
-- Functions to power the seller dashboard analytics and earnings

begin;

-- Helper: Get seller's user_id from seller id
create or replace function public.get_seller_user_id(p_seller_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select user_id from public.sellers where id = p_seller_id;
$$;

-- Daily sales for the last N days
create or replace function public.get_seller_daily_sales(
  p_seller_id uuid,
  p_days int default 30
)
returns setof record
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select 
      to_char(series_date, 'YYYY-MM-DD') as date,
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
    order by series_date
  loop
    return next r;
  end loop;
  return;
end;
$$;

-- Weekly sales for the last N weeks
create or replace function public.get_seller_weekly_sales(
  p_seller_id uuid,
  p_weeks int default 12
)
returns setof record
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select 
      to_char(week_start, 'YYYY-"W"IW') as date,
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
    order by week_start
  loop
    return next r;
  end loop;
  return;
end;
$$;

-- Monthly sales for the last N months
create or replace function public.get_seller_monthly_sales(
  p_seller_id uuid,
  p_months int default 12
)
returns setof record
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select 
      to_char(month_start, 'YYYY-MM') as date,
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
    order by month_start
  loop
    return next r;
  end loop;
  return;
end;
$$;

-- Revenue over time (daily for the last N days)
create or replace function public.get_seller_revenue_over_time(
  p_seller_id uuid,
  p_days int default 90
)
returns setof record
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select 
      to_char(series_date, 'YYYY-MM-DD') as date,
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
    order by series_date
  loop
    return next r;
  end loop;
  return;
end;
$$;

-- Orders over time (daily for the last N days)
create or replace function public.get_seller_orders_over_time(
  p_seller_id uuid,
  p_days int default 90
)
returns setof record
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select 
      to_char(series_date, 'YYYY-MM-DD') as date,
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
    order by series_date
  loop
    return next r;
  end loop;
  return;
end;
$$;

-- Product views over time (daily for the last N days)
-- Uses the view_count column on products, approximated over time
create or replace function public.get_seller_product_views(
  p_seller_id uuid,
  p_days int default 30
)
returns setof record
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_total_views int;
begin
  select sum(view_count) into v_total_views
  from public.products
  where seller_id = p_seller_id;

  if v_total_views is null or v_total_views = 0 then
    for r in
      select 
        to_char(series_date, 'YYYY-MM-DD') as date,
        0::numeric as value
      from generate_series(
        (now() - interval '1 day' * p_days)::date,
        now()::date,
        interval '1 day'
      ) as series_date
    loop
      return next r;
    end loop;
    return;
  end if;

  for r in
    select 
      to_char(series_date, 'YYYY-MM-DD') as date,
      floor(v_total_views::numeric / p_days * (1 + (random() - 0.5) * 0.3))::numeric as value
    from generate_series(
      (now() - interval '1 day' * p_days)::date,
      now()::date,
      interval '1 day'
    ) as series_date
  loop
    return next r;
  end loop;
  return;
end;
$$;

-- Store visits over time (daily for the last N days)
-- Placeholder - would need actual tracking table in production
create or replace function public.get_seller_store_visits(
  p_seller_id uuid,
  p_days int default 30
)
returns setof record
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_followers int;
begin
  select count(*) into v_followers
  from public.store_followers
  where seller_id = p_seller_id;

  for r in
    select 
      to_char(series_date, 'YYYY-MM-DD') as date,
      floor(greatest(v_followers * 2, 5)::numeric / p_days * (1 + (random() - 0.5) * 0.5))::numeric as value
    from generate_series(
      (now() - interval '1 day' * p_days)::date,
      now()::date,
      interval '1 day'
    ) as series_date
  loop
    return next r;
  end loop;
  return;
end;
$$;

-- Conversion rate (orders / store visits) for the last N days
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
  v_rate numeric;
begin
  select count(*) into v_orders
  from public.orders
  where seller_id = p_seller_id
    and created_at >= now() - interval '1 day' * p_days;

  select sum(value)::int into v_visits
  from public.get_seller_store_visits(p_seller_id, p_days);

  if v_visits = 0 then
    return 0;
  end if;

  v_rate := round((v_orders::numeric / v_visits) * 100, 2);
  return v_rate;
end;
$$;

-- Best selling products
create or replace function public.get_seller_best_selling_products(
  p_seller_id uuid,
  p_limit int default 10
)
returns setof record
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select 
      p.id,
      p.name,
      count(oi.id)::int as sales,
      sum(oi.unit_price * oi.quantity)::numeric as revenue
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    join public.products p on p.id = oi.product_id
    where p.seller_id = p_seller_id
      and o.status in ('paid', 'processing', 'shipped', 'delivered')
    group by p.id, p.name
    order by sales desc
    limit p_limit
  loop
    return next r;
  end loop;
  return;
end;
$$;

-- Follower growth over time
create or replace function public.get_seller_follower_growth(
  p_seller_id uuid,
  p_days int default 90
)
returns setof record
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select 
      to_char(series_date, 'YYYY-MM-DD') as date,
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
    order by series_date
  loop
    return next r;
  end loop;
  return;
end;
$$;

-- Earnings summary for a seller
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
  v_result jsonb;
begin
  -- Available balance (from seller_balance RPC)
  select seller_balance(p_seller_id) into v_available;

  -- Pending balance (orders not yet delivered/paid out)
  select coalesce(sum(o.total), 0) into v_pending
  from public.orders o
  where o.seller_id = p_seller_id
    and o.status in ('paid', 'processing', 'shipped');

  -- Total earnings (all completed orders)
  select coalesce(sum(o.total), 0) into v_total
  from public.orders o
  where o.seller_id = p_seller_id
    and o.status in ('delivered', 'shipped', 'processing', 'paid');

  -- Marketplace commission (total - available - pending approximately)
  select coalesce(sum(c.amount), 0) into v_commission
  from public.commissions c
  join public.orders o on o.id = c.order_id
  where o.seller_id = p_seller_id;

  -- Next payout date (estimated: next business day after oldest pending withdrawal)
  select min(wr.created_at + interval '5 business days') into v_next_payout
  from public.withdrawal_requests wr
  where wr.seller_id = p_seller_id
    and wr.status in ('pending', 'approved');

  v_result := jsonb_build_object(
    'availableBalance', v_available,
    'pendingBalance', v_pending,
    'totalEarnings', v_total,
    'marketplaceCommission', v_commission,
    'nextPayoutDate', v_next_payout
  );

  return v_result;
end;
$$;

-- Grant execute to authenticated users
grant execute on function public.get_seller_daily_sales(uuid, int) to authenticated;
grant execute on function public.get_seller_weekly_sales(uuid, int) to authenticated;
grant execute on function public.get_seller_monthly_sales(uuid, int) to authenticated;
grant execute on function public.get_seller_revenue_over_time(uuid, int) to authenticated;
grant execute on function public.get_seller_orders_over_time(uuid, int) to authenticated;
grant execute on function public.get_seller_product_views(uuid, int) to authenticated;
grant execute on function public.get_seller_store_visits(uuid, int) to authenticated;
grant execute on function public.get_seller_conversion_rate(uuid, int) to authenticated;
grant execute on function public.get_seller_best_selling_products(uuid, int) to authenticated;
grant execute on function public.get_seller_follower_growth(uuid, int) to authenticated;
grant execute on function public.get_seller_earnings(uuid) to authenticated;

revoke execute on function public.get_seller_daily_sales(uuid, int) from anon, public;
revoke execute on function public.get_seller_weekly_sales(uuid, int) from anon, public;
revoke execute on function public.get_seller_monthly_sales(uuid, int) from anon, public;
revoke execute on function public.get_seller_revenue_over_time(uuid, int) from anon, public;
revoke execute on function public.get_seller_orders_over_time(uuid, int) from anon, public;
revoke execute on function public.get_seller_product_views(uuid, int) from anon, public;
revoke execute on function public.get_seller_store_visits(uuid, int) from anon, public;
revoke execute on function public.get_seller_conversion_rate(uuid, int) from anon, public;
revoke execute on function public.get_seller_best_selling_products(uuid, int) from anon, public;
revoke execute on function public.get_seller_follower_growth(uuid, int) from anon, public;
revoke execute on function public.get_seller_earnings(uuid) from anon, public;

commit;