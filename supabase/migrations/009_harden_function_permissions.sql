-- 009_harden_function_permissions.sql
-- Hardening pass: pin search_path and tighten EXECUTE grants on RPCs.

-- 1) Mutable search_path -> pinned to public
alter function public.is_admin() set search_path = public;
alter function public.current_seller() set search_path = public;
alter function public.generate_order_number() set search_path = public;
alter function public.handle_updated_at() set search_path = public;

-- 2) Trigger-only SECURITY DEFINER functions must not be callable via RPC
revoke execute on function public.enforce_stock_floor() from anon, public;
revoke execute on function public.handle_new_user() from anon, public;
revoke execute on function public.notify_admins_seller_applied() from anon, public;
revoke execute on function public.notify_seller_new_order() from anon, public;
revoke execute on function public.notify_seller_new_review() from anon, public;

-- handle_new_user is fired by the auth.users trigger as supabase_auth_admin
grant execute on function public.handle_new_user() to supabase_auth_admin, service_role;

-- 3) notify_user is internal-only (called by SECURITY DEFINER triggers / set_seller_status)
revoke execute on function public.notify_user(uuid, text, text, text, jsonb) from anon, authenticated, public;

-- 4) update_my_seller_profile: authenticated sellers only
revoke execute on function public.update_my_seller_profile(text, text, text, text, text, text, text, jsonb, jsonb) from anon, public;
grant execute on function public.update_my_seller_profile(text, text, text, text, text, text, text, jsonb, jsonb) to authenticated;
