-- ============================================================
-- CAPPTURE — Security hardening (advisor remediation)
-- ============================================================

begin;

-- Helpers used inside RLS policies are now SECURITY INVOKER so they
-- evaluate under the caller's row-level context (anon → false/null).
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.current_seller()
returns uuid
language sql
stable
as $$
  select id from public.sellers
  where user_id = auth.uid() and application_status = 'approved'
  limit 1;
$$;

-- Revoke public/anonymous execution from privileged RPCs.
revoke execute on function public.place_order(uuid, jsonb, text, jsonb, jsonb, text, text) from anon;
revoke execute on function public.set_seller_status(uuid, text, text) from anon;
revoke execute on function public.notify_user(uuid, text, text, text, jsonb) from anon;
revoke execute on function public.enforce_stock_floor() from anon;

-- Trigger functions should not be callable through the API.
revoke execute on function public.handle_new_user() from public;
grant execute on function public.handle_new_user() to supabase_auth_admin, service_role;

-- Public buckets serve objects via public URLs; no SELECT (listing) needed.
drop policy if exists "store_assets_public_read" on storage.objects;
drop policy if exists "product_images_public_read" on storage.objects;

commit;
