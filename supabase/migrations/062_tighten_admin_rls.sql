-- 062_tighten_admin_rls.sql
--
-- Findings H3 + M1 (HIGH/MEDIUM): several "admin" RLS policies use the coarse
-- `is_admin()` (= any staff role), which over-exposes data and lets any staff
-- member bypass the guarded action RPCs by writing tables directly.
--
-- Verified (rolled back) as support_agent:
--   * UPDATE public.orders            -> 1 row   (bypasses staff_set_order_status)
--   * UPDATE public.profiles          -> 1 row   (role-escalation vector)
--   * SELECT all orders/profiles/commissions/withdrawal_requests/sellers
--
-- This migration re-gates the affected policies with specific permissions.
-- It pairs with 061 (RPC guards). 060 must be applied first so that
-- `sellers` no longer holds the sensitive KYC columns.
--
-- Rollback: re-create each policy below with `using (public.is_admin())`.

begin;

-- orders -------------------------------------------------------------------
drop policy if exists orders_select_admin on public.orders;
create policy orders_select_admin on public.orders
  for select to public
  using (public.has_permission('orders.view'));

drop policy if exists orders_update_admin on public.orders;
create policy orders_update_admin on public.orders
  for update to public
  using (public.has_permission('orders.manage'))
  with check (public.has_permission('orders.manage'));

-- profiles -----------------------------------------------------------------
-- Read access for staff is retained (needed across support/seller/finance
-- screens); the write path is the escalation risk and is locked to super_admin.
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update to public
  using (public.has_permission('staff.permissions.manage'))
  with check (public.has_permission('staff.permissions.manage'));

-- sellers ------------------------------------------------------------------
drop policy if exists sellers_select_admin on public.sellers;
create policy sellers_select_admin on public.sellers
  for select to public
  using (
    public.has_permission('sellers.review')
    or public.has_permission('sellers.manage')
    or public.has_permission('payouts.review')
    or public.has_permission('payments.view')
  );

drop policy if exists sellers_update_admin on public.sellers;
create policy sellers_update_admin on public.sellers
  for update to public
  using (public.has_permission('sellers.manage'))
  with check (public.has_permission('sellers.manage'));

drop policy if exists sellers_delete_admin on public.sellers;
create policy sellers_delete_admin on public.sellers
  for delete to public
  using (public.current_admin_role() = 'super_admin');

-- withdrawal_requests ------------------------------------------------------
drop policy if exists "Admins manage withdrawal requests" on public.withdrawal_requests;
create policy "Admins manage withdrawal requests" on public.withdrawal_requests
  for all to public
  using (public.has_permission('payouts.review'))
  with check (public.has_permission('payouts.review'));

-- commissions --------------------------------------------------------------
drop policy if exists commissions_select_admin on public.commissions;
create policy commissions_select_admin on public.commissions
  for select to public
  using (public.has_permission('payments.view'));

drop policy if exists commissions_update_admin on public.commissions;
create policy commissions_update_admin on public.commissions
  for update to public
  using (public.has_permission('payments.reconcile'))
  with check (public.has_permission('payments.reconcile'));

-- wallet_transactions ------------------------------------------------------
drop policy if exists wallet_transactions_read_admin on public.wallet_transactions;
create policy wallet_transactions_read_admin on public.wallet_transactions
  for select to public
  using (public.has_permission('payments.view'));

-- payfast_payments ---------------------------------------------------------
drop policy if exists payfast_payments_write_admin on public.payfast_payments;
create policy payfast_payments_read_admin on public.payfast_payments
  for select to public
  using (public.has_permission('payments.view'));
create policy payfast_payments_write_admin on public.payfast_payments
  for all to public
  using (public.has_permission('system.settings.manage'))
  with check (public.has_permission('system.settings.manage'));

-- messages -----------------------------------------------------------------
drop policy if exists "Admins have full access to messages" on public.messages;
create policy "Admins have full access to messages" on public.messages
  for all to public
  using (public.has_permission('messaging.send'))
  with check (public.has_permission('messaging.send'));

-- support tickets ----------------------------------------------------------
drop policy if exists support_tickets_admin_all on public.support_tickets;
create policy support_tickets_admin_all on public.support_tickets
  for all to public
  using (public.has_permission('support.tickets.manage'))
  with check (public.has_permission('support.tickets.manage'));

drop policy if exists support_ticket_messages_admin_all on public.support_ticket_messages;
create policy support_ticket_messages_admin_all on public.support_ticket_messages
  for all to public
  using (public.has_permission('support.tickets.manage'))
  with check (public.has_permission('support.tickets.manage'));

commit;

-- ---------------------------------------------------------------------------
-- Notes / follow-ups flagged for review (NOT changed here):
--   * profiles_select_admin still uses is_admin(). Kept intentionally: multiple
--     staff consoles need customer contact details. Revisit if a stricter
--     customer-PII gate is desired.
--   * `sellers_select_admin` now depends on the 060 drop; before 060 it also
--     exposed KYC columns to these roles.
--   * Direct table UPDATEs by non-owners are now blocked for support on
--     orders/sellers/withdrawals. Confirm each console still uses the guarded
--     RPCs (staff_set_order_status, set_seller_status, process_withdrawal, ...).
-- ---------------------------------------------------------------------------
