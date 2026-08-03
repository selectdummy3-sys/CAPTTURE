-- ============================================================
-- CAPPTURE — Restore SECURITY DEFINER on helper functions
-- ============================================================
-- Regression: is_admin(), current_seller(), generate_order_number()
-- and handle_updated_at() were running as SECURITY INVOKER, causing
-- infinite RLS recursion (is_admin -> profiles -> profiles_select_admin
-- -> is_admin ...) -> "stack depth limit exceeded" / statement timeouts
-- -> HTTP 500 on public reads of products/sellers/categories.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
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
security definer
set search_path = public
as $$
  select id from public.sellers
  where user_id = auth.uid() and application_status = 'approved'
  limit 1;
$$;

create or replace function public.generate_order_number()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select lpad(floor(random() * 1000000)::int::text, 6, '0');
$$;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.current_seller() to anon, authenticated;
grant execute on function public.generate_order_number() to authenticated;
revoke execute on function public.generate_order_number() from public, anon;
revoke execute on function public.handle_updated_at() from public, anon;
