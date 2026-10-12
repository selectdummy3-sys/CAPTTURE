-- 054_support_ticket_status_lockdown.sql
-- Supabase grants EXECUTE on new functions to anon/authenticated by default
-- (via alter default privileges), so revoking from PUBLIC alone is not enough.
-- set_support_ticket_status is admin-only; remove the anon grant so the anon
-- role cannot reach the RPC. Signed-in admins remain covered by the
-- authenticated grant.

begin;

revoke execute on function public.set_support_ticket_status(uuid, text, text) from anon;

commit;
