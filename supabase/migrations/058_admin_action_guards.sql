-- 058_admin_action_guards.sql
--
-- ⚠️  REVIEW-ONLY — DO NOT APPLY WITHOUT APPROVAL.
--
-- Purpose
--   Migrations 055/056 introduced granular staff roles and harden the *entry*
--   points (RLS reads, admin RPC grants to `authenticated`). However the
--   existing write RPCs still only check the broad `is_admin()` predicate, and
--   because they are SECURITY DEFINER they bypass RLS. That means ANY staff
--   member (e.g. a support_agent) can currently call finance/seller/fulfilment
--   actions they were never granted.
--
--   This migration narrows each action RPC to its specific permission.
--
-- Strategy (low-risk, no behaviour rewrite)
--   For every existing action RPC we:
--     1. RENAME the current function to `<name>_unchecked`,
--     2. REVOKE execute on the renamed function from every role (only the
--        SECURITY DEFINER wrapper, running as owner, can still call it),
--     3. CREATE a thin SECURITY DEFINER wrapper with the ORIGINAL name and
--        signature that asserts the required permission and then delegates.
--   The original body is never re-typed, so validation/notification/state logic
--   is preserved byte-for-byte.
--
--   Also adds ONE new action that did not exist: `staff_set_order_status`
--   (fulfilment needs a real order-state action), gated by `orders.manage`.
--
-- Permission map
--   process_withdrawal          -> payouts.review
--   set_support_ticket_status   -> support.tickets.manage
--   set_seller_status           -> sellers.manage
--   set_product_status          -> products.moderate
--   delete_seller               -> super_admin only (destructive, no restore)
--   staff_set_order_status      -> orders.manage   (NEW)
--
-- Rollback
--   drop function public.<name>(...); and
--   alter function public.<name>_unchecked(...) rename to <name>;
--   grant execute ... to authenticated;
--   (See "Rollback" section at the bottom for the full script.)
--
-- Idempotency
--   Guarded by a `to_regprocedure('<name>_unchecked')` check so re-running the
--   file is safe and does not double-wrap an already-guarded function.

-- ---------------------------------------------------------------------------
-- Finance: process_withdrawal
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regprocedure('public.process_withdrawal_unchecked(uuid, text, text)') is null then
    alter function public.process_withdrawal(uuid, text, text) rename to process_withdrawal_unchecked;
    revoke all on function public.process_withdrawal_unchecked(uuid, text, text) from public, anon, authenticated;
  end if;
end $$;

create or replace function public.process_withdrawal(
  p_request_id uuid,
  p_action     text,
  p_notes      text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_permission('payouts.review') then
    raise exception 'permission denied: payouts.review' using errcode = '42501';
  end if;
  perform public.process_withdrawal_unchecked(p_request_id, p_action, p_notes);
end $$;

revoke all on function public.process_withdrawal(uuid, text, text) from public, anon;
grant execute on function public.process_withdrawal(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Support: set_support_ticket_status
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regprocedure('public.set_support_ticket_status_unchecked(uuid, text, text)') is null then
    alter function public.set_support_ticket_status(uuid, text, text) rename to set_support_ticket_status_unchecked;
    revoke all on function public.set_support_ticket_status_unchecked(uuid, text, text) from public, anon, authenticated;
  end if;
end $$;

create or replace function public.set_support_ticket_status(
  p_ticket_id uuid,
  p_status    text,
  p_priority  text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_permission('support.tickets.manage') then
    raise exception 'permission denied: support.tickets.manage' using errcode = '42501';
  end if;
  perform public.set_support_ticket_status_unchecked(p_ticket_id, p_status, p_priority);
end $$;

revoke all on function public.set_support_ticket_status(uuid, text, text) from public, anon;
grant execute on function public.set_support_ticket_status(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Seller management: set_seller_status
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regprocedure('public.set_seller_status_unchecked(uuid, text, text)') is null then
    alter function public.set_seller_status(uuid, text, text) rename to set_seller_status_unchecked;
    revoke all on function public.set_seller_status_unchecked(uuid, text, text) from public, anon, authenticated;
  end if;
end $$;

create or replace function public.set_seller_status(
  p_seller_id uuid,
  p_status    text,
  p_reason    text default null
)
returns public.sellers
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_permission('sellers.manage') then
    raise exception 'permission denied: sellers.manage' using errcode = '42501';
  end if;
  return public.set_seller_status_unchecked(p_seller_id, p_status, p_reason);
end $$;

revoke all on function public.set_seller_status(uuid, text, text) from public, anon;
grant execute on function public.set_seller_status(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Product moderation: set_product_status
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regprocedure('public.set_product_status_unchecked(uuid, text, text)') is null then
    alter function public.set_product_status(uuid, text, text) rename to set_product_status_unchecked;
    revoke all on function public.set_product_status_unchecked(uuid, text, text) from public, anon, authenticated;
  end if;
end $$;

create or replace function public.set_product_status(
  p_product_id uuid,
  p_status     text,
  p_reason     text default null
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_permission('products.moderate') then
    raise exception 'permission denied: products.moderate' using errcode = '42501';
  end if;
  return public.set_product_status_unchecked(p_product_id, p_status, p_reason);
end $$;

revoke all on function public.set_product_status(uuid, text, text) from public, anon;
grant execute on function public.set_product_status(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Destructive: delete_seller (super_admin only)
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regprocedure('public.delete_seller_unchecked(uuid)') is null then
    alter function public.delete_seller(uuid) rename to delete_seller_unchecked;
    revoke all on function public.delete_seller_unchecked(uuid) from public, anon, authenticated;
  end if;
end $$;

create or replace function public.delete_seller(p_seller_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_admin_role() is distinct from 'super_admin' then
    raise exception 'permission denied: super_admin only' using errcode = '42501';
  end if;
  perform public.delete_seller_unchecked(p_seller_id);
end $$;

revoke all on function public.delete_seller(uuid) from public, anon;
grant execute on function public.delete_seller(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- NEW: Fulfilment order-state action (did not previously exist)
-- ---------------------------------------------------------------------------
create or replace function public.staff_set_order_status(
  p_order_id uuid,
  p_status   text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_permission('orders.manage') then
    raise exception 'permission denied: orders.manage' using errcode = '42501';
  end if;

  if p_status not in ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') then
    raise exception 'invalid order status: %', p_status;
  end if;

  update public.orders
  set status = p_status,
      updated_at = now()
  where id = p_order_id;

  if not found then
    raise exception 'order not found';
  end if;
end $$;

revoke all on function public.staff_set_order_status(uuid, text) from public, anon;
grant execute on function public.staff_set_order_status(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Rollback (run manually if this migration must be undone)
-- ---------------------------------------------------------------------------
-- drop function public.staff_set_order_status(uuid, text);
-- drop function public.delete_seller(uuid);
-- alter function public.delete_seller_unchecked(uuid) rename to delete_seller;
-- grant execute on function public.delete_seller(uuid) to authenticated;
-- drop function public.set_product_status(uuid, text, text);
-- alter function public.set_product_status_unchecked(uuid, text, text) rename to set_product_status;
-- grant execute on function public.set_product_status(uuid, text, text) to authenticated;
-- drop function public.set_seller_status(uuid, text, text);
-- alter function public.set_seller_status_unchecked(uuid, text, text) rename to set_seller_status;
-- grant execute on function public.set_seller_status(uuid, text, text) to authenticated;
-- drop function public.set_support_ticket_status(uuid, text, text);
-- alter function public.set_support_ticket_status_unchecked(uuid, text, text) rename to set_support_ticket_status;
-- grant execute on function public.set_support_ticket_status(uuid, text, text) to authenticated;
-- drop function public.process_withdrawal(uuid, text, text);
-- alter function public.process_withdrawal_unchecked(uuid, text, text) rename to process_withdrawal;
-- grant execute on function public.process_withdrawal(uuid, text, text) to authenticated;
