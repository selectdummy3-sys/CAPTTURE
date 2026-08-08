-- ============================================================
-- CAPPTURE — Per-seller finance summary for admins
-- ============================================================
-- Lets the platform owner see, for any seller:
--   - how much the seller has made (gross, net after commission)
--   - how much the platform has made from that seller (commission)
-- Uses the same per-order net semantics as get_seller_earnings():
-- net = order total - sum(commissions for that order), counting the
-- active statuses pending/paid/processing/shipped/delivered.
-- ============================================================

create or replace function public.admin_seller_finance(p_seller_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
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
  if not public.is_admin() then
    raise exception 'admin only';
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
$function$;

revoke all on function public.admin_seller_finance(uuid) from public;
grant execute on function public.admin_seller_finance(uuid) to authenticated;
