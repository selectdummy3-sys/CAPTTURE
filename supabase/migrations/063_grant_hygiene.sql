-- 063_grant_hygiene.sql
--
-- Lower-severity hardening:
--   * L1: `role_permissions_read` (USING true, role authenticated) lets any
--     logged-in user read the whole permission matrix. The client only ever
--     resolves its own access via the `my_admin_access` RPC, so restrict the
--     policy to the caller's own role.
--   * L2 / H2: several admin RPCs are executable by anon/PUBLIC. Guards already
--     block them, but remove the grants for defence in depth. None of these are
--     called by the public site or by edge functions.

begin;

-- role_permissions: only expose the caller's own role's rows -----------------
drop policy if exists role_permissions_read on public.role_permissions;
create policy role_permissions_read on public.role_permissions
  for select to authenticated
  using (admin_role = public.current_admin_role());

-- Remove anon / PUBLIC execute from admin-only RPCs -------------------------
do $$
declare
  sigs text[] := array[
    'public.set_app_settings(jsonb)',
    'public.set_announcement(text, boolean)',
    'public.set_commission_settings(numeric, boolean)',
    'public.get_payfast_config_admin()',
    'public.set_payfast_config(text, text, text, boolean, text, text, text, text)',
    'public.admin_commission_stats()',
    'public.admin_seller_finance(uuid)',
    'public.get_supply_stats()',
    'public.send_message(uuid, text, text, boolean)',
    'public.get_seller_user_id(uuid)'
  ];
  s text;
begin
  foreach s in array sigs loop
    execute format('revoke all on function %s from public, anon', s);
    execute format('grant execute on function %s to authenticated, service_role', s);
  end loop;
end;
$$;

commit;

-- Rollback: restore role_permissions_read USING true; re-grant anon if needed.
