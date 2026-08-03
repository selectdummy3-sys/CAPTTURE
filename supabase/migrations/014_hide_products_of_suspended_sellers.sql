-- ============================================================
-- CAPPTURE — Hide products of suspended/rejected sellers
-- ============================================================
-- The storefront only lists `published` products. When an admin suspends
-- a seller, their products should temporarily disappear from the store
-- (and reappear automatically when re-approved). This policy excludes
-- products whose seller is not `approved` from anonymous reads.

drop policy if exists "products_select_public" on public.products;

create policy "products_select_public"
  on public.products for select
  using (
    status = 'published'
    and exists (
      select 1 from public.sellers s
      where s.id = seller_id and s.application_status = 'approved'
    )
  );
