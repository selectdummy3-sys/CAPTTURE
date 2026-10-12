-- 055_admin_roles_permissions_audit.sql
-- Foundation for the role-based internal operations platform.
--
-- Design goals (all additive + backward compatible):
--   * Introduce a server-side staff role + granular permission model.
--   * Keep the existing profiles.role ('customer'|'seller'|'admin') for
--     identity/login; staff roles are a separate concern in staff_accounts.
--   * is_admin() is redefined to also return true for staff members so that
--     existing RLS policies continue to work for internal users. Legacy
--     accounts with profiles.role = 'admin' keep full (super_admin) access,
--     so there is no lock-out risk.
--   * Sensitive RPCs are re-created with explicit permission checks, a
--     last-admin guard and audit logging.
--
-- Recovery procedure (if an administrator is ever locked out):
--   update public.profiles set role = 'admin' where id = '<user uuid>';
--   -- is_admin() derives super_admin from profiles.role = 'admin'.
--
-- This migration is safe to run repeatedly (idempotent).

begin;

-- ---------------------------------------------------------------------------
-- 1. Staff roles
-- ---------------------------------------------------------------------------
do $$
begin
  create type public.admin_role as enum (
    'super_admin',
    'support_agent',
    'support_supervisor',
    'fulfilment_agent',
    'seller_manager',
    'finance_officer'
  );
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 2. staff_accounts — the trusted server-side role source of truth
-- ---------------------------------------------------------------------------
create table if not exists public.staff_accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  admin_role public.admin_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);

alter table public.staff_accounts enable row level security;

-- ---------------------------------------------------------------------------
-- 3. role_permissions — permission matrix (seeded below)
-- ---------------------------------------------------------------------------
create table if not exists public.role_permissions (
  admin_role public.admin_role not null,
  permission text not null,
  primary key (admin_role, permission)
);

alter table public.role_permissions enable row level security;

-- ---------------------------------------------------------------------------
-- 4. admin_audit_log — append-only trail for sensitive admin actions
-- ---------------------------------------------------------------------------
create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text,
  entity_id text,
  outcome text,
  reason text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;

create index if not exists admin_audit_log_created_idx
  on public.admin_audit_log (created_at desc);

-- ---------------------------------------------------------------------------
-- 5. Access helper functions (SECURITY DEFINER -> read the trusted tables
--    without triggering RLS recursion).
-- ---------------------------------------------------------------------------
create or replace function public.current_admin_role()
returns public.admin_role
language sql
stable
security definer
set search_path = public
as $$
  select case
    when sa.admin_role is not null then sa.admin_role
    when p.role = 'admin' then 'super_admin'::public.admin_role
    else null
  end
  from public.profiles p
  left join public.staff_accounts sa on sa.user_id = p.id
  where p.id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_admin_role() is not null;
$$;

create or replace function public.has_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_admin_role() = 'super_admin'
      or exists (
        select 1
        from public.role_permissions rp
        where rp.admin_role = public.current_admin_role()
          and rp.permission = p_permission
      );
$$;

-- Redefine is_admin() so existing RLS/RPC/edge checks accept staff members.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_staff();
$$;

-- The client uses this single call to learn its role + permissions.
create or replace function public.my_admin_access()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'is_staff', (r is not null),
    'role', r,
    'permissions',
    case
      when r is null then '[]'::jsonb
      when r = 'super_admin' then (
        select coalesce(jsonb_agg(distinct permission), '[]'::jsonb)
        from unnest(array[
          'support.tickets.view','support.tickets.manage',
          'support.conversations.view','support.conversations.manage',
          'orders.view','orders.manage',
          'sellers.review','sellers.manage','products.moderate',
          'payments.view','payments.reconcile','refunds.review','payouts.review',
          'reports.view','staff.permissions.manage','system.settings.manage',
          'content.manage','promotions.manage','messaging.send',
          'supplies.manage','supplies.orders','audit.view'
        ]) as permission
      )
      else (
        select coalesce(jsonb_agg(permission), '[]'::jsonb)
        from public.role_permissions
        where admin_role = r
      )
    end
  )
  from (select public.current_admin_role() as r) s;
$$;

-- Append-only audit writer. Internal only (execute revoked from clients).
create or replace function public.log_admin_action(
  p_action text,
  p_entity_type text default null,
  p_entity_id text default null,
  p_outcome text default 'success',
  p_reason text default null,
  p_metadata jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, outcome, reason, metadata)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_outcome, p_reason, p_metadata);
end $$;

-- ---------------------------------------------------------------------------
-- 6. Seed the permission matrix
-- ---------------------------------------------------------------------------
insert into public.role_permissions (admin_role, permission) values
  ('support_agent', 'support.tickets.view'),
  ('support_agent', 'support.tickets.manage'),
  ('support_agent', 'support.conversations.view'),
  ('support_agent', 'orders.view'),
  ('support_supervisor', 'support.tickets.view'),
  ('support_supervisor', 'support.tickets.manage'),
  ('support_supervisor', 'support.conversations.view'),
  ('support_supervisor', 'support.conversations.manage'),
  ('support_supervisor', 'orders.view'),
  ('fulfilment_agent', 'orders.view'),
  ('fulfilment_agent', 'orders.manage'),
  ('seller_manager', 'sellers.review'),
  ('seller_manager', 'sellers.manage'),
  ('seller_manager', 'products.moderate'),
  ('seller_manager', 'orders.view'),
  ('finance_officer', 'payments.view'),
  ('finance_officer', 'payments.reconcile'),
  ('finance_officer', 'refunds.review'),
  ('finance_officer', 'payouts.review'),
  ('finance_officer', 'reports.view'),
  ('finance_officer', 'orders.view'),
  ('finance_officer', 'supplies.orders')
on conflict (admin_role, permission) do nothing;

-- ---------------------------------------------------------------------------
-- 7. RLS policies for the new tables
-- ---------------------------------------------------------------------------
drop policy if exists staff_accounts_select_self on public.staff_accounts;
create policy staff_accounts_select_self on public.staff_accounts
  for select
  using (user_id = (select auth.uid()) or public.has_permission('staff.permissions.manage'));

drop policy if exists staff_accounts_write_admin on public.staff_accounts;
create policy staff_accounts_write_admin on public.staff_accounts
  for all
  using (public.has_permission('staff.permissions.manage'))
  with check (public.has_permission('staff.permissions.manage'));

drop policy if exists role_permissions_read on public.role_permissions;
create policy role_permissions_read on public.role_permissions
  for select
  to authenticated
  using (true);

-- Append-only: staff with audit.view may read; nobody may update/delete.
drop policy if exists admin_audit_log_read on public.admin_audit_log;
create policy admin_audit_log_read on public.admin_audit_log
  for select
  to authenticated
  using (public.has_permission('audit.view'));

-- ---------------------------------------------------------------------------
-- 8. Safe re-creation of the previously unmigrated role RPCs
-- ---------------------------------------------------------------------------
create or replace function public.list_admin_team()
returns table(id uuid, email text, full_name text, role text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, coalesce(p.email, ''), coalesce(p.full_name, ''), p.role, p.created_at
  from public.profiles p
  where public.has_permission('staff.permissions.manage')
  order by p.created_at desc;
$$;

create or replace function public.set_user_role(p_user_id uuid, p_role text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_role text;
  v_admin_count int;
begin
  if not public.has_permission('staff.permissions.manage') then
    raise exception 'Not authorised to manage roles';
  end if;
  if p_role not in ('customer', 'seller', 'admin') then
    raise exception 'Invalid role: %', p_role;
  end if;
  select role into v_target_role from public.profiles where id = p_user_id;
  if v_target_role is null then
    raise exception 'User not found';
  end if;
  if v_target_role = 'admin' and p_role <> 'admin' then
    select count(*) into v_admin_count
    from public.profiles
    where role = 'admin' or id in (select user_id from public.staff_accounts where admin_role = 'super_admin');
    if v_admin_count <= 1 then
      raise exception 'Cannot demote the last remaining admin';
    end if;
  end if;
  update public.profiles set role = p_role where id = p_user_id;
  perform public.log_admin_action(
    'staff.set_identity_role', 'profile', p_user_id::text, 'success', null,
    jsonb_build_object('from', v_target_role, 'to', p_role)
  );
  return jsonb_build_object('ok', true, 'role', p_role);
end $$;

-- ---------------------------------------------------------------------------
-- 9. Staff role assignment RPCs (super-admin only, audited, no self-escalation)
-- ---------------------------------------------------------------------------
create or replace function public.list_staff()
returns table(user_id uuid, email text, full_name text, admin_role text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select sa.user_id, coalesce(p.email, ''), coalesce(p.full_name, ''), sa.admin_role::text, sa.created_at
  from public.staff_accounts sa
  join public.profiles p on p.id = sa.user_id
  where public.has_permission('staff.permissions.manage')
  order by sa.created_at desc;
$$;

create or replace function public.assign_staff_role(
  p_user_id uuid,
  p_role public.admin_role,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_permission('staff.permissions.manage') then
    raise exception 'Not authorised to assign staff roles';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'You cannot change your own staff role';
  end if;
  insert into public.staff_accounts (user_id, admin_role, created_by)
  values (p_user_id, p_role, auth.uid())
  on conflict (user_id) do update
    set admin_role = excluded.admin_role,
        updated_at = now(),
        created_by = auth.uid();
  perform public.log_admin_action(
    'staff.assign_role', 'staff_account', p_user_id::text, 'success', p_reason,
    jsonb_build_object('admin_role', p_role)
  );
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.revoke_staff_role(
  p_user_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_permission('staff.permissions.manage') then
    raise exception 'Not authorised to revoke staff roles';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'You cannot revoke your own staff access';
  end if;
  if exists (select 1 from public.staff_accounts where user_id = p_user_id and admin_role = 'super_admin') then
    if (select count(*) from public.staff_accounts where admin_role = 'super_admin') <= 1
       and not exists (select 1 from public.profiles where id <> p_user_id and role = 'admin') then
      raise exception 'Cannot remove the last super admin';
    end if;
  end if;
  delete from public.staff_accounts where user_id = p_user_id;
  perform public.log_admin_action('staff.revoke_role', 'staff_account', p_user_id::text, 'success', p_reason, null);
  return jsonb_build_object('ok', true);
end $$;

-- ---------------------------------------------------------------------------
-- 10. Audit reader (permission gated)
-- ---------------------------------------------------------------------------
create or replace function public.get_audit_log(p_limit int default 100)
returns setof public.admin_audit_log
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.admin_audit_log
  where public.has_permission('audit.view')
  order by created_at desc
  limit least(coalesce(p_limit, 100), 500);
$$;

-- ---------------------------------------------------------------------------
-- 11. Generic audit triggers for sensitive status changes
-- ---------------------------------------------------------------------------
create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_col text := coalesce(tg_argv[0], 'status');
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  v_old jsonb := case when tg_op in ('DELETE', 'UPDATE') then to_jsonb(old) else null end;
  v_row jsonb := coalesce(v_new, v_old);
  v_old_val text := v_old ->> v_col;
  v_new_val text := v_new ->> v_col;
  v_action text;
begin
  -- Only record actions performed by internal staff.
  if not public.is_staff() then
    return null;
  end if;

  if tg_op = 'INSERT' then
    v_action := 'create';
  elsif tg_op = 'DELETE' then
    v_action := 'delete';
  else
    v_action := 'update';
  end if;

  if tg_op = 'UPDATE' and v_new_val is not distinct from v_old_val then
    return null;
  end if;

  perform public.log_admin_action(
    tg_table_name || '.' || v_action,
    tg_table_name,
    v_row ->> 'id',
    'success',
    null,
    jsonb_strip_nulls(jsonb_build_object('from', v_old_val, 'to', v_new_val))
  );
  return null;
end $$;

drop trigger if exists audit_sellers on public.sellers;
create trigger audit_sellers
  after insert or update or delete on public.sellers
  for each row execute function public.audit_row_change('application_status');

drop trigger if exists audit_products on public.products;
create trigger audit_products
  after insert or update or delete on public.products
  for each row execute function public.audit_row_change('status');

drop trigger if exists audit_withdrawal_requests on public.withdrawal_requests;
create trigger audit_withdrawal_requests
  after insert or update or delete on public.withdrawal_requests
  for each row execute function public.audit_row_change('status');

drop trigger if exists audit_support_tickets on public.support_tickets;
create trigger audit_support_tickets
  after insert or update or delete on public.support_tickets
  for each row execute function public.audit_row_change('status');

-- ---------------------------------------------------------------------------
-- 12. Grants — keep self-checked RPCs on authenticated, lock down internals.
-- ---------------------------------------------------------------------------
revoke execute on function public.my_admin_access() from anon;
revoke execute on function public.list_staff() from anon;
revoke execute on function public.assign_staff_role(uuid, public.admin_role, text) from anon;
revoke execute on function public.revoke_staff_role(uuid, text) from anon;
revoke execute on function public.get_audit_log(int) from anon;
revoke execute on function public.set_user_role(uuid, text) from anon;
revoke execute on function public.list_admin_team() from anon;
revoke execute on function public.log_admin_action(text, text, text, text, text, jsonb) from anon, authenticated, public;
revoke execute on function public.audit_row_change() from anon, authenticated, public;

commit;
