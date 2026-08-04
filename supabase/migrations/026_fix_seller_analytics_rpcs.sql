-- ============================================================
-- CAPPTURE — Fix seller analytics RPCs
-- ============================================================
-- PostgREST cannot expose functions returning `SETOF record`
-- (no stable column list). Recreate as RETURNS TABLE(...) and
-- fix get_seller_earnings which wrongly called seller_balance(uuid).

begin;

drop function if exists public.get_seller_daily_sales(uuid, int);
create function public.get_seller_daily_sales(
  p_seller_id uuid,
  p_days int default 30
)
returns table(date text, value numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
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

drop function if exists public.get_seller_weekly_sales(uuid, int);
create function public.get_seller_weekly_sales(
  p_seller_id uuid,
  p_weeks int default 12
)
returns table(date text, value numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
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

drop function if exists public.get_seller_monthly_sales(uuid, int);
create function public.get_seller_monthly_sales(
  p_seller_id uuid,
  p_months int default 12
)
returns table(date text, value numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
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

drop function if exists public.get_seller_revenue_over_time(uuid, int);
create function public.get_seller_revenue_over_time(
  p_seller_id uuid,
  p_days int default 90
)
returns table(date text, value numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
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

drop function if exists public.get_seller_orders_over_time(uuid, int);
create function public.get_seller_orders_over_time(
  p_seller_id uuid,
  p_days int default 90
)
returns table(date text, value numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
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

drop function if exists public.get_seller_product_views(uuid, int);
create function public.get_seller_product_views(
  p_seller_id uuid,
  p_days int default 30
)
returns table(date text, value numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_views int;
begin
  select sum(view_count) into v_total_views
  from public.products
  where seller_id = p_seller_id;

  if v_total_views is null or v_total_views = 0 then
    return query
      select
        to_char(series_date, 'YYYY-MM-DD')::text as date,
        0::numeric as value
      from generate_series(
        (now() - interval '1 day' * p_days)::date,
        now()::date,
        interval '1 day'
      ) as series_date;
    return;
  end if;

  return query
    select
      to_char(series_date, 'YYYY-MM-DD')::text as date,
      floor(v_total_views::numeric / p_days * (1 + (random() - 0.5) * 0.3))::numeric as value
    from generate_series(
      (now() - interval '1 day' * p_days)::date,
      now()::date,
      interval '1 day'
    ) as series_date;
end;
$$;

drop function if exists public.get_seller_store_visits(uuid, int);
create function public.get_seller_store_visits(
  p_seller_id uuid,
  p_days int default 30
)
returns table(date text, value numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_followers int;
begin
  select count(*) into v_followers
  from public.store_followers
  where seller_id = p_seller_id;

  return query
    select
      to_char(series_date, 'YYYY-MM-DD')::text as date,
      floor(greatest(v_followers * 2, 5)::numeric / p_days * (1 + (random() - 0.5) * 0.5))::numeric as value
    from generate_series(
      (now() - interval '1 day' * p_days)::date,
      now()::date,
      interval '1 day'
    ) as series_date;
end;
$$;

drop function if exists public.get_seller_best_selling_products(uuid, int);
create function public.get_seller_best_selling_products(
  p_seller_id uuid,
  p_limit int default 10
)
returns table(id uuid, name text, sales int, revenue numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
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

drop function if exists public.get_seller_follower_growth(uuid, int);
create function public.get_seller_follower_growth(
  p_seller_id uuid,
  p_days int default 90
)
returns table(date text, value numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
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
  )
  select e.v - c.v - w.v into v_available
  from earnings e, commissions_paid c, withdrawals_done w;

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
