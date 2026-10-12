-- 061_narrow_admin_rpcs.sql
--
-- Finding H2 (HIGH): every residual admin RPC is guarded only by
-- `if not public.is_admin()`, i.e. ANY staff role (support_agent, fulfilment,
-- etc.) can execute them. Verified in a rolled-back transaction: a
-- support_agent successfully ran set_app_settings, set_payfast_config,
-- get_payfast_config_admin, admin_seller_finance, admin_commission_stats,
-- send_message (bulk) and get_supply_stats.
--
-- Fix: replace the coarse `is_admin()` guard with a specific
-- `has_permission('<key>')` check on each RPC. `has_permission` is true for
-- super_admin and for any role that holds the key. No non-super role currently
-- holds these keys, so this collapses them to super_admin until/unless keys are
-- granted in role_permissions.
--
-- Gate mapping (approved):
--   set_app_settings / set_payfast_config / get_payfast_config_admin /
--   set_announcement / set_commission_settings  -> system.settings.manage
--   admin_commission_stats                      -> reports.view
--   admin_seller_finance                        -> sellers.review
--   get_supply_stats                            -> supplies.manage
--   send_message                                -> messaging.send
--   get_seller_user_id                          -> keep guard; revoke anon/PUBLIC

begin;

-- set_app_settings ---------------------------------------------------------
create or replace function public.set_app_settings(p_settings jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  k text;
begin
  if not public.has_permission('system.settings.manage') then
    raise exception 'permission denied: system.settings.manage';
  end if;

  if p_settings is null or jsonb_typeof(p_settings) <> 'object' then
    raise exception 'app settings must be a JSON object';
  end if;

  for k in select jsonb_object_keys(p_settings) loop
    if jsonb_typeof(p_settings -> k) <> 'boolean' and jsonb_typeof(p_settings -> k) <> 'string' then
      raise exception 'app setting % must be a boolean or string', k;
    end if;
  end loop;

  insert into public.platform_settings (key, value)
  values ('app', p_settings)
  on conflict (key) do update
    set value = excluded.value;
end;
$$;

-- set_announcement ---------------------------------------------------------
create or replace function public.set_announcement(p_text text, p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_permission('system.settings.manage') then
    raise exception 'permission denied: system.settings.manage';
  end if;
  if p_text is null or length(p_text) > 500 then
    raise exception 'announcement text must be at most 500 characters';
  end if;

  insert into public.platform_settings (key, value)
  values ('announcement', jsonb_build_object('text', p_text, 'enabled', p_enabled))
  on conflict (key) do update
    set value = jsonb_build_object('text', p_text, 'enabled', p_enabled);
end;
$$;

-- set_commission_settings --------------------------------------------------
create or replace function public.set_commission_settings(p_rate numeric, p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_permission('system.settings.manage') then
    raise exception 'permission denied: system.settings.manage';
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

-- get_payfast_config_admin -------------------------------------------------
create or replace function public.get_payfast_config_admin()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cfg public.payfast_config%rowtype;
begin
  if not public.has_permission('system.settings.manage') then
    raise exception 'permission denied: system.settings.manage';
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

-- set_payfast_config -------------------------------------------------------
create or replace function public.set_payfast_config(
  p_merchant_id text default null,
  p_merchant_key text default null,
  p_passphrase text default null,
  p_sandbox boolean default true,
  p_merchant_name text default null,
  p_return_url text default null,
  p_cancel_url text default null,
  p_notify_url text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_permission('system.settings.manage') then
    raise exception 'permission denied: system.settings.manage';
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

-- admin_commission_stats ---------------------------------------------------
create or replace function public.admin_commission_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_total     numeric;
  v_collected numeric;
  v_pending   numeric;
  v_count     bigint;
begin
  if not public.has_permission('reports.view') then
    raise exception 'permission denied: reports.view';
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

-- admin_seller_finance -----------------------------------------------------
create or replace function public.admin_seller_finance(p_seller_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_orders     bigint;
  v_gross      numeric;
  v_commission numeric;
  v_net        numeric;
  v_available  numeric;
  v_pending    numeric;
  v_withdrawn  numeric;
  v_spend      numeric;
begin
  if not public.has_permission('sellers.review') then
    raise exception 'permission denied: sellers.review';
  end if;

  with order_net as (
    select o.status,
           o.total,
           coalesce((select sum(c.amount) from public.commissions c where c.order_id = o.id), 0) as comm
    from public.orders o
    where o.seller_id = p_seller_id
      and o.status in ('pending', 'paid', 'processing', 'shipped', 'delivered')
  ),
  totals as (
    select
      count(*) as orders,
      coalesce(sum(total), 0) as gross,
      coalesce(sum(comm), 0) as commission,
      coalesce(sum(total - comm), 0) as net,
      coalesce(sum(total - comm) filter (where status = 'delivered'), 0) as available,
      coalesce(sum(total - comm) filter (where status in ('pending', 'paid', 'processing', 'shipped')), 0) as pending
    from order_net
  ),
  withdrawals as (
    select coalesce(sum(w.amount), 0) as v
    from public.withdrawal_requests w
    where w.seller_id = p_seller_id and w.status in ('approved', 'paid')
  ),
  spend as (
    select coalesce(sum(wt.amount), 0) as v
    from public.wallet_transactions wt
    where wt.seller_id = p_seller_id
  )
  select t.orders, t.gross, t.commission, t.net,
         t.available - w.v + sp.v, t.pending, w.v
    into v_orders, v_gross, v_commission, v_net, v_available, v_pending, v_withdrawn
  from totals t, withdrawals w, spend sp;

  return jsonb_build_object(
    'orders', v_orders,
    'gross', round(v_gross, 2),
    'commission', round(v_commission, 2),
    'net', round(v_net, 2),
    'available', round(v_available, 2),
    'pending', round(v_pending, 2),
    'withdrawn', round(v_withdrawn, 2)
  );
end;
$$;

-- get_supply_stats ---------------------------------------------------------
create or replace function public.get_supply_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_stats jsonb;
begin
  if not public.has_permission('supplies.manage') then
    raise exception 'permission denied: supplies.manage';
  end if;

  select jsonb_build_object(
    'totalRevenue',   coalesce(sum(total), 0),
    'totalOrders',    count(*),
    'paidOrders',     count(*) filter (where payment_status = 'paid'),
    'pendingOrders',  count(*) filter (where status not in ('delivered', 'cancelled', 'refunded')),
    'revenue30d',     coalesce(sum(total) filter (where created_at >= now() - interval '30 days'), 0),
    'productsCount',  (select count(*) from public.supply_products),
    'activeProducts', (select count(*) from public.supply_products where is_active),
    'lowStockCount',  (select count(*) from public.supply_products
                        where is_active and type = 'physical' and stock is not null and stock <= 5),
    'categoriesCount', (select count(*) from public.supply_categories where is_active)
  ) into v_stats
  from public.supply_orders;

  return v_stats;
end;
$$;

-- send_message -------------------------------------------------------------
create or replace function public.send_message(
  p_seller_id uuid,
  p_subject text,
  p_body text,
  p_is_bulk boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender uuid;
  v_id     uuid;
begin
  if not public.has_permission('messaging.send') then
    raise exception 'permission denied: messaging.send';
  end if;

  v_sender := auth.uid();

  if p_is_bulk then
    insert into public.messages (sender_id, seller_id, subject, body, is_bulk)
    select v_sender, s.id, p_subject, p_body, true
    from public.sellers s
    where s.application_status = 'approved';
    return null;
  else
    if p_seller_id is null then
      raise exception 'seller_id is required for direct messages';
    end if;
    insert into public.messages (sender_id, seller_id, subject, body, is_bulk)
    values (v_sender, p_seller_id, p_subject, p_body, false)
    returning id into v_id;
    return v_id;
  end if;
end;
$$;

-- get_seller_user_id: dead RPC (no callers) that was PUBLIC-executable.
-- Keep the body but remove anon/PUBLIC execute.
revoke all on function public.get_seller_user_id(uuid) from public, anon;
grant execute on function public.get_seller_user_id(uuid) to authenticated, service_role;

-- Re-assert service-role access on the re-created RPCs.
grant execute on function public.set_app_settings(jsonb) to authenticated, service_role;
grant execute on function public.set_announcement(text, boolean) to authenticated, service_role;
grant execute on function public.set_commission_settings(numeric, boolean) to authenticated, service_role;
grant execute on function public.get_payfast_config_admin() to authenticated, service_role;
grant execute on function public.set_payfast_config(text, text, text, boolean, text, text, text, text) to authenticated, service_role;
grant execute on function public.admin_commission_stats() to authenticated, service_role;
grant execute on function public.admin_seller_finance(uuid) to authenticated, service_role;
grant execute on function public.get_supply_stats() to authenticated, service_role;
grant execute on function public.send_message(uuid, text, text, boolean) to authenticated, service_role;

commit;

-- Rollback: re-apply the pre-061 bodies (guards `if not public.is_admin()`).
