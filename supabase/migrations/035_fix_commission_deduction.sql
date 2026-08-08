-- ============================================================
-- CAPPTURE — Deduct marketplace commission from seller balances
-- ============================================================
-- Fix: commissions were calculated and recorded on every order, but
-- the seller balance/earnings functions only deducted commissions
-- with status = 'paid'. Since nothing ever marks commissions as paid,
-- the deduction never happened and sellers saw gross order totals.
--
-- Fix: both get_seller_earnings() and seller_balance() now derive the
-- net per order as `order total - sum(commissions for that order)`.
-- This uses the existing commission rows (no new calculation) and is a
-- pure computation, so it is idempotent: an order can never be charged
-- twice, even if the functions are re-run or an order is re-processed.
-- ============================================================

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

create or replace function public.seller_balance()
returns numeric
language sql
stable
security definer
set search_path to 'public'
as $function$
  with order_net as (
    select o.total - coalesce((select sum(c.amount) from public.commissions c where c.order_id = o.id), 0) as net
    from public.orders o
    where o.seller_id = (select id from public.sellers where user_id = auth.uid())
      and o.status = 'delivered'
  ),
  available as (
    select coalesce(sum(net), 0) as total_net from order_net
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
    a.total_net - w.total_withdrawn + s.total_spend
  from available a, withdrawals_done w, wallet_spend s;
$function$;
