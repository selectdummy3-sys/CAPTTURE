-- 008_approved_seller_profile_rpc.sql
-- Lets approved sellers update their own storefront profile without widening
-- the RLS update policy on sensitive columns.

create or replace function public.update_my_seller_profile(
  p_business_name text,
  p_description text default null,
  p_province text default null,
  p_phone text default null,
  p_email text default null,
  p_logo_url text default null,
  p_banner_url text default null,
  p_social_links jsonb default '{}'::jsonb,
  p_bank_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid;
begin
  select id into v_seller_id
    from public.sellers
    where user_id = auth.uid();

  if v_seller_id is null then
    raise exception 'No seller account for the current user';
  end if;

  update public.sellers set
    business_name = p_business_name,
    description    = coalesce(p_description, description),
    province       = coalesce(p_province, province),
    phone          = coalesce(p_phone, phone),
    email          = coalesce(p_email, email),
    logo_url       = coalesce(p_logo_url, logo_url),
    banner_url     = coalesce(p_banner_url, banner_url),
    social_links   = coalesce(p_social_links, social_links),
    bank_details   = coalesce(p_bank_details, bank_details)
  where id = v_seller_id;
end;
$$;

revoke all on function public.update_my_seller_profile(text, text, text, text, text, text, text, jsonb, jsonb)
  from public;

grant execute on function public.update_my_seller_profile(text, text, text, text, text, text, text, jsonb, jsonb)
  to authenticated;
