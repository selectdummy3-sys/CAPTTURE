-- 060_seller_private.sql
--
-- ⚠️  REVIEW BEFORE APPLYING. This migration MUST be deployed together with the
--    coordinated application change below. Applying it alone WILL break the
--    seller application, store settings and admin seller screens.
--
-- Finding C1 (CRITICAL): seller `bank_details`, `id_document_url` and
-- `proof_of_residence_url` are readable by anyone (including `anon`) because
-- the approved-seller RLS policy `sellers_select_approved`
-- (USING application_status = 'approved', role PUBLIC) is ROW-level only, so it
-- exposes every column. Verified with a rolled-back query: an unauthenticated
-- client could read all three columns.
--
-- Fix: move the three sensitive columns out of the widely-readable `sellers`
-- table into a tightly-scoped `seller_private` table, then drop the columns from
-- `sellers` so the approved-seller policy can no longer leak them.
--
-- Coordinated application change required (same deploy):
--   * src/pages/seller/SellerApplyPage.tsx
--       - stop writing id_document_url / proof_of_residence_url / bank_details
--         on the `sellers` insert/update; instead upsert them into
--         `seller_private` (keyed by the seller id) after the seller row exists.
--       - read these three values from `seller_private` for form prefill.
--   * src/pages/seller/SellerSettings.tsx
--       - read bank details from `seller_private` (already written through the
--         `update_my_seller_profile` RPC, which this migration re-points).
--   * src/pages/admin/AdminSellers.tsx (+ src/hooks/useAdmin.ts `useAllSellers`)
--       - fetch bank/ID/proof from `seller_private` (join or secondary query);
--         `useAllSellers` currently selects `*` from `sellers`.
--   * Regenerate src/types/database.ts.
--
-- Rollback: recreate the three columns on `sellers`, copy the values back from
-- `seller_private`, then drop `seller_private`. See bottom of file.

begin;

-- 1. Sensitive store, keyed 1:1 to the seller row.
create table if not exists public.seller_private (
  seller_id              uuid primary key references public.sellers(id) on delete cascade,
  bank_details           jsonb not null default '{}'::jsonb,
  id_document_url        text,
  proof_of_residence_url text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

comment on table public.seller_private is
  'Sensitive seller KYC + payout data. Readable only by the owning seller and privileged staff (sellers.review / payouts.review / payments.view). Never exposed to anon.';

-- 2. Backfill from the current columns.
insert into public.seller_private (seller_id, bank_details, id_document_url, proof_of_residence_url)
select s.id,
       coalesce(s.bank_details, '{}'::jsonb),
       s.id_document_url,
       s.proof_of_residence_url
from public.sellers s
on conflict (seller_id) do update
  set bank_details           = excluded.bank_details,
      id_document_url        = excluded.id_document_url,
      proof_of_residence_url = excluded.proof_of_residence_url,
      updated_at             = now();

-- 3. Lock the table down.
alter table public.seller_private enable row level security;

revoke all on public.seller_private from anon;
grant select, insert, update on public.seller_private to authenticated;
grant all    on public.seller_private to service_role;

drop policy if exists seller_private_select_own on public.seller_private;
create policy seller_private_select_own on public.seller_private
  for select to authenticated
  using (exists (
    select 1 from public.sellers s
    where s.id = seller_id and s.user_id = auth.uid()
  ));

drop policy if exists seller_private_select_privileged on public.seller_private;
create policy seller_private_select_privileged on public.seller_private
  for select to authenticated
  using (
    public.has_permission('sellers.review')
    or public.has_permission('payouts.review')
    or public.has_permission('payments.view')
  );

drop policy if exists seller_private_insert_own on public.seller_private;
create policy seller_private_insert_own on public.seller_private
  for insert to authenticated
  with check (exists (
    select 1 from public.sellers s
    where s.id = seller_id and s.user_id = auth.uid()
  ));

drop policy if exists seller_private_update_own on public.seller_private;
create policy seller_private_update_own on public.seller_private
  for update to authenticated
  using (exists (
    select 1 from public.sellers s
    where s.id = seller_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.sellers s
    where s.id = seller_id and s.user_id = auth.uid()
  ));

drop policy if exists seller_private_write_privileged on public.seller_private;
create policy seller_private_write_privileged on public.seller_private
  for all to authenticated
  using (public.has_permission('sellers.review'))
  with check (public.has_permission('sellers.review'));

-- 4. Re-point the two RPCs that read/write these columns.

-- update_my_seller_profile: write bank details to seller_private (unchanged
-- signature/grants). Non-sensitive fields still go to `sellers`.
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
    where user_id = auth.uid() and application_status = 'approved';

  if v_seller_id is null then
    raise exception 'Approved seller account required';
  end if;

  update public.sellers set
    business_name = p_business_name,
    description   = coalesce(p_description, description),
    province      = coalesce(p_province, province),
    phone         = coalesce(p_phone, phone),
    email         = coalesce(p_email, email),
    logo_url      = coalesce(p_logo_url, logo_url),
    banner_url    = coalesce(p_banner_url, banner_url),
    social_links  = coalesce(p_social_links, social_links)
  where id = v_seller_id;

  if p_bank_details is not null then
    insert into public.seller_private (seller_id, bank_details)
    values (v_seller_id, coalesce(p_bank_details, '{}'::jsonb))
    on conflict (seller_id) do update
      set bank_details = coalesce(excluded.bank_details, public.seller_private.bank_details),
          updated_at   = now();
  end if;
end;
$$;

revoke all on function public.update_my_seller_profile(text, text, text, text, text, text, text, jsonb, jsonb) from public;
grant execute on function public.update_my_seller_profile(text, text, text, text, text, text, text, jsonb, jsonb) to authenticated, service_role;

-- request_withdrawal: read the bank snapshot from seller_private.
create or replace function public.request_withdrawal(p_amount numeric)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid;
  v_balance   numeric(12,2);
  v_bank      jsonb;
  v_id        uuid;
begin
  select s.id, sp.bank_details into v_seller_id, v_bank
  from public.sellers s
  left join public.seller_private sp on sp.seller_id = s.id
  where s.user_id = auth.uid() and s.application_status = 'approved';

  if v_seller_id is null then
    raise exception 'No approved seller account found';
  end if;

  if v_bank is null or v_bank = '{}'::jsonb
     or v_bank->>'bank_name' is null or v_bank->>'bank_name' = ''
     or v_bank->>'account_number' is null or v_bank->>'account_number' = '' then
    raise exception 'Please add your bank details in Store Settings first';
  end if;

  if p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  v_balance := public.seller_balance();
  if p_amount > v_balance then
    raise exception 'Insufficient balance. Available: R%', v_balance;
  end if;

  insert into public.withdrawal_requests (seller_id, amount, bank_snapshot)
  values (v_seller_id, p_amount, v_bank)
  returning id into v_id;

  return v_id;
end;
$$;

-- 5. Drop the exposed columns from `sellers`.
alter table public.sellers
  drop column if exists bank_details,
  drop column if exists id_document_url,
  drop column if exists proof_of_residence_url;

commit;

-- ---------------------------------------------------------------------------
-- Rollback (manual):
--   alter table public.sellers
--     add column if not exists bank_details jsonb not null default '{}'::jsonb,
--     add column if not exists id_document_url text,
--     add column if not exists proof_of_residence_url text;
--   update public.sellers s set
--     bank_details = sp.bank_details,
--     id_document_url = sp.id_document_url,
--     proof_of_residence_url = sp.proof_of_residence_url
--   from public.seller_private sp where sp.seller_id = s.id;
--   -- then restore the 008/018 RPC bodies and: drop table public.seller_private;
-- ---------------------------------------------------------------------------
