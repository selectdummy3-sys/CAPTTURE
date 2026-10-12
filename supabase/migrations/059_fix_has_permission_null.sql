-- 059_fix_has_permission_null.sql
--
-- ⚠️  CRITICAL SECURITY FIX — review before applying.
--
-- Vulnerability (introduced by 055, still live in production)
--   `public.has_permission()` returns NULL — not FALSE — when the caller has no
--   admin role:
--
--     select public.current_admin_role() = 'super_admin' or exists (...);
--     -- current_admin_role() IS NULL  =>  NULL = 'super_admin'  =>  NULL
--     -- NULL OR <exists...>          =>  NULL
--
--   PL/pgSQL guards written as `if not public.has_permission(p) then raise ...`
--   therefore do NOT fire for non-staff callers, because `not NULL` is NULL and
--   `IF NULL` is treated as false. Any authenticated (non-staff) user can thus
--   bypass the permission check on these SECURITY DEFINER RPCs:
--     * set_user_role       (privilege escalation -> profiles.role = 'admin')
--     * assign_staff_role   (grant any staff role to any other user)
--     * revoke_staff_role   (strip staff access from any user)
--
--   Verified in a rolled-back transaction: a logged-in customer with no staff
--   row successfully executed set_user_role(<self>, 'admin').
--
-- Fix
--   Make has_permission return FALSE (never NULL) when the role is NULL.
--   This is a pure tightening. Every existing RLS `USING (has_permission(...))`
--   and `WHERE has_permission(...)` already treats NULL as "deny"/"filter out",
--   so switching NULL -> FALSE changes no legitimate behaviour; it only makes
--   the `if not has_permission(...)` guards actually enforce.
--
-- Rollback
--   Re-apply the 055 definition (without `coalesce`). NOT recommended.

create or replace function public.has_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_admin_role() = 'super_admin', false)
      or exists (
        select 1
        from public.role_permissions rp
        where rp.admin_role = public.current_admin_role()
          and rp.permission = p_permission
      );
$$;
