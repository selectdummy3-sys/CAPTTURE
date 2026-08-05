-- 028_real_analytics.sql
-- Replace fabricated analytics (random()) with real event tracking.

begin;

-- ============================================================
-- Tracking tables
-- ============================================================

create table if not exists public.store_visits (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.product_view_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists store_visits_seller_day_idx on public.store_visits (seller_id, created_at);
create index if not exists product_view_events_product_day_idx on public.product_view_events (product_id, created_at);

-- Both tables are written and read exclusively through SECURITY DEFINER
-- functions below, so no RLS policies are granted and direct access is denied.
alter table public.store_visits enable row level security;
alter table public.product_view_events enable row level security;

-- ============================================================
-- Tracking functions
-- ============================================================

create or replace function public.track_store_visit(p_seller_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.store_visits (seller_id, user_id)
  values (p_seller_id, auth.uid());
end;
$$;

create or replace function public.track_product_view(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.product_view_events (product_id, user_id)
  values (p_product_id, auth.uid());

  update public.products
  set view_count = coalesce(view_count, 0) + 1
  where id = p_product_id;
end;
$$;

grant execute on function public.track_store_visit(uuid) to anon, authenticated;
grant execute on function public.track_product_view(uuid) to anon, authenticated;

-- ============================================================
-- Analytics backed by real data
-- ============================================================

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
begin
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
begin
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

commit;
