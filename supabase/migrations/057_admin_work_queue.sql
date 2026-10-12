-- 057_admin_work_queue.sql
-- Permission-scoped operational work queues for internal staff.
--
-- Purpose
--   Provide a single, server-enforced source of truth for each staff member's
--   day-to-day work: support tickets, fulfilment actions, finance tasks and
--   seller review tasks. The function returns ONLY the sections the caller's
--   permission set allows, so client-side filtering is never the security
--   boundary.
--
-- Design notes
--   * Read-only + additive. No schema changes, no data mutation.
--   * SECURITY DEFINER so it can read across tables without loosening RLS.
--   * Every section is gated behind has_permission(...); a missing permission
--     yields null (the section is omitted from the payload entirely).
--   * Deliberately excludes customer PII, internal notes and bank details.
--   * Real database state only; no invented counts.
--
-- Idempotent (create or replace).

create or replace function public.admin_work_queue()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_now  timestamptz := now();
  v_me   uuid := auth.uid();
  v_role public.admin_role := public.current_admin_role();
  v_support    jsonb;
  v_fulfilment jsonb;
  v_finance    jsonb;
  v_sellers    jsonb;
  v_alerts     jsonb := '[]'::jsonb;
begin
  if v_role is null then
    return jsonb_build_object(
      'role', null,
      'generated_at', v_now,
      'support', null,
      'fulfilment', null,
      'finance', null,
      'sellers', null,
      'alerts', '[]'::jsonb
    );
  end if;

  -- -----------------------------------------------------------------------
  -- Support: open/assigned/urgent/overdue tickets + AI-sourced conversations
  -- -----------------------------------------------------------------------
  if public.has_permission('support.tickets.view') then
    with base as (
      select id, reference, subject, priority, status, source,
             assigned_to, last_message_at, created_at
      from public.support_tickets
      where status in ('open', 'pending')
    )
    select jsonb_build_object(
      'open',       (select count(*) from base),
      'unassigned', (select count(*) from base where assigned_to is null),
      'mine',       (select count(*) from base where assigned_to = v_me),
      'urgent',     (select count(*) from base where priority in ('high', 'urgent')),
      'overdue',    (select count(*) from base
                     where coalesce(last_message_at, created_at) < v_now - interval '48 hours'),
      'ai',         (select count(*) from base where source = 'ai_chat'),
      'items', coalesce((
        select jsonb_agg(row_to_json(t))
        from (
          select id, reference, subject, priority, status, source,
                 (assigned_to = v_me) as assigned_to_me,
                 (assigned_to is null) as unassigned,
                 (coalesce(last_message_at, created_at) < v_now - interval '48 hours') as overdue,
                 round(extract(epoch from (v_now - coalesce(last_message_at, created_at))) / 3600)::int as age_hours
          from base
          order by (priority = 'urgent') desc,
                   (priority = 'high') desc,
                   coalesce(last_message_at, created_at) asc
          limit 25
        ) t
      ), '[]'::jsonb)
    ) into v_support;
  end if;

  -- -----------------------------------------------------------------------
  -- Fulfilment: actionable order queues, processing exceptions, delays
  -- -----------------------------------------------------------------------
  if public.has_permission('orders.view') then
    with base as (
      select id, order_number, status, payment_status, delivery_method,
             total, created_at, updated_at
      from public.orders
    )
    select jsonb_build_object(
      'to_process',       (select count(*) from base where status in ('paid', 'processing')),
      'awaiting_payment', (select count(*) from base where payment_status = 'pending_confirmation'),
      'delayed',          (select count(*) from base
                           where status in ('paid', 'processing', 'shipped')
                             and updated_at < v_now - interval '5 days'),
      'exceptions',       (select count(*) from base
                           where payment_status = 'pending_confirmation'
                             and created_at < v_now - interval '24 hours'),
      'items', coalesce((
        select jsonb_agg(row_to_json(t))
        from (
          select id, order_number, status, payment_status, delivery_method, total,
                 (updated_at < v_now - interval '5 days') as delayed,
                 (payment_status = 'pending_confirmation'
                    and created_at < v_now - interval '24 hours') as exception,
                 round(extract(epoch from (v_now - updated_at)) / 3600)::int as age_hours
          from base
          where status in ('paid', 'processing', 'shipped')
          order by updated_at asc
          limit 25
        ) t
      ), '[]'::jsonb)
    ) into v_fulfilment;
  end if;

  -- -----------------------------------------------------------------------
  -- Finance: reconciliation, payment exceptions, refund reviews, payouts
  -- -----------------------------------------------------------------------
  if public.has_permission('payments.view')
     or public.has_permission('payments.reconcile')
     or public.has_permission('refunds.review')
     or public.has_permission('payouts.review') then
    v_finance := jsonb_build_object(
      'can_reconcile', public.has_permission('payments.reconcile') or public.has_permission('payments.view'),
      'can_refund',    public.has_permission('refunds.review'),
      'can_payout',    public.has_permission('payouts.review'),
      'unreconciled', (case when public.has_permission('payments.view')
                            or public.has_permission('payments.reconcile')
                        then (select count(*) from public.payfast_payments where status = 'pending')
                        else null end),
      'exceptions',   (case when public.has_permission('payments.view')
                             or public.has_permission('payments.reconcile')
                        then (select count(*) from public.orders
                              where payment_status = 'pending_confirmation'
                                and created_at < v_now - interval '24 hours')
                        else null end),
      'refund_reviews', (case when public.has_permission('refunds.review')
                        then (select count(*) from public.orders
                              where status = 'cancelled' and payment_status = 'paid')
                        else null end),
      'payout_requests', (case when public.has_permission('payouts.review')
                        then (select count(*) from public.withdrawal_requests where status = 'pending')
                        else null end),
      'payouts_overdue', (case when public.has_permission('payouts.review')
                        then (select count(*) from public.withdrawal_requests
                              where status = 'pending' and created_at < v_now - interval '48 hours')
                        else null end),
      'commissions_pending', (case when public.has_permission('payments.view')
                        then (select count(*) from public.commissions where status = 'pending')
                        else null end),
      'items', jsonb_build_object(
        'payouts', case when public.has_permission('payouts.review') then coalesce((
          select jsonb_agg(row_to_json(t))
          from (
            select id, amount, status, created_at,
                   (created_at < v_now - interval '48 hours') as overdue,
                   round(extract(epoch from (v_now - created_at)) / 3600)::int as age_hours
            from public.withdrawal_requests
            where status = 'pending'
            order by created_at asc
            limit 25
          ) t
        ), '[]'::jsonb) else null end,
        'refunds', case when public.has_permission('refunds.review') then coalesce((
          select jsonb_agg(row_to_json(t))
          from (
            select id, order_number, total, created_at,
                   round(extract(epoch from (v_now - created_at)) / 3600)::int as age_hours
            from public.orders
            where status = 'cancelled' and payment_status = 'paid'
            order by created_at asc
            limit 25
          ) t
        ), '[]'::jsonb) else null end,
        'payments', case when public.has_permission('payments.view')
                         or public.has_permission('payments.reconcile') then coalesce((
          select jsonb_agg(row_to_json(t))
          from (
            select id, payment_ref, amount, status, created_at,
                   round(extract(epoch from (v_now - created_at)) / 3600)::int as age_hours
            from public.payfast_payments
            where status = 'pending'
            order by created_at asc
            limit 25
          ) t
        ), '[]'::jsonb) else null end
      )
    );
  end if;

  -- -----------------------------------------------------------------------
  -- Seller management: applications + product moderation
  -- -----------------------------------------------------------------------
  if public.has_permission('sellers.review') then
    v_sellers := jsonb_build_object(
      'applications_pending', (select count(*) from public.sellers where application_status = 'pending'),
      'suspended',            (select count(*) from public.sellers where application_status = 'suspended'),
      'products_pending',     (case when public.has_permission('products.moderate')
                               then (select count(*) from public.products where status = 'pending')
                               else null end),
      'can_moderate',         public.has_permission('products.moderate'),
      'items', jsonb_build_object(
        'applications', coalesce((
          select jsonb_agg(row_to_json(t))
          from (
            select id, business_name, province, created_at,
                   round(extract(epoch from (v_now - created_at)) / 3600)::int as age_hours
            from public.sellers
            where application_status = 'pending'
            order by created_at asc
            limit 25
          ) t
        ), '[]'::jsonb)
      )
    );
  end if;

  -- -----------------------------------------------------------------------
  -- Critical alerts (only those the caller is permitted to see)
  -- -----------------------------------------------------------------------
  if public.has_permission('support.tickets.view') then
    v_alerts := v_alerts || jsonb_build_object(
      'kind', 'support_urgent',
      'severity', 'high',
      'title', 'Urgent support tickets',
      'count', (select count(*) from public.support_tickets
                where status in ('open', 'pending') and priority in ('high', 'urgent')),
      'href', '/admin/support'
    );
  end if;
  if public.has_permission('payouts.review') then
    v_alerts := v_alerts || jsonb_build_object(
      'kind', 'payouts_overdue',
      'severity', 'high',
      'title', 'Payout requests awaiting review > 48h',
      'count', (select count(*) from public.withdrawal_requests
                where status = 'pending' and created_at < v_now - interval '48 hours'),
      'href', '/admin/withdrawals'
    );
  end if;
  if public.has_permission('payments.view') or public.has_permission('payments.reconcile') then
    v_alerts := v_alerts || jsonb_build_object(
      'kind', 'payment_exceptions',
      'severity', 'high',
      'title', 'Payments stuck pending confirmation > 24h',
      'count', (select count(*) from public.orders
                where payment_status = 'pending_confirmation'
                  and created_at < v_now - interval '24 hours'),
      'href', '/admin/orders'
    );
  end if;
  if public.has_permission('orders.view') then
    v_alerts := v_alerts || jsonb_build_object(
      'kind', 'delayed_deliveries',
      'severity', 'medium',
      'title', 'Orders not updated in over 5 days',
      'count', (select count(*) from public.orders
                where status in ('paid', 'processing', 'shipped')
                  and updated_at < v_now - interval '5 days'),
      'href', '/admin/orders'
    );
  end if;
  if public.has_permission('sellers.review') then
    v_alerts := v_alerts || jsonb_build_object(
      'kind', 'seller_applications',
      'severity', 'medium',
      'title', 'Seller applications awaiting review',
      'count', (select count(*) from public.sellers where application_status = 'pending'),
      'href', '/admin/sellers'
    );
  end if;

  return jsonb_build_object(
    'role', v_role,
    'generated_at', v_now,
    'support', v_support,
    'fulfilment', v_fulfilment,
    'finance', v_finance,
    'sellers', v_sellers,
    'alerts', coalesce(v_alerts, '[]'::jsonb)
  );
end $$;

-- Lock down: authenticated staff only (the function self-checks permissions).
revoke execute on function public.admin_work_queue() from public, anon;
grant execute on function public.admin_work_queue() to authenticated;
