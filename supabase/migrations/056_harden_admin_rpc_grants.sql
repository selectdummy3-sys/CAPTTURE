-- 056_harden_admin_rpc_grants.sql
-- The privileged RPCs created in 055 self-check permissions, but PostgreSQL
-- grants EXECUTE to PUBLIC by default, so `anon` could still reach them. Revoke
-- the PUBLIC grant and re-grant to `authenticated` only.
--
-- NOTE: the access *helper* functions (has_permission, is_admin, is_staff,
-- current_admin_role) are intentionally left broadly executable because RLS
-- policies on publicly readable tables evaluate them for `anon` too; they
-- return false for anonymous callers and expose no data.
--
-- Idempotent.

begin;

revoke execute on function public.my_admin_access() from public, anon;
revoke execute on function public.list_staff() from public, anon;
revoke execute on function public.assign_staff_role(uuid, public.admin_role, text) from public, anon;
revoke execute on function public.revoke_staff_role(uuid, text) from public, anon;
revoke execute on function public.get_audit_log(int) from public, anon;
revoke execute on function public.set_user_role(uuid, text) from public, anon;
revoke execute on function public.list_admin_team() from public, anon;

grant execute on function public.my_admin_access() to authenticated;
grant execute on function public.list_staff() to authenticated;
grant execute on function public.assign_staff_role(uuid, public.admin_role, text) to authenticated;
grant execute on function public.revoke_staff_role(uuid, text) to authenticated;
grant execute on function public.get_audit_log(int) to authenticated;
grant execute on function public.set_user_role(uuid, text) to authenticated;
grant execute on function public.list_admin_team() to authenticated;

commit;
