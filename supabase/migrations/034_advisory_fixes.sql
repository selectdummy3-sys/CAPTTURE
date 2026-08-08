-- ============================================================
-- CAPPTURE — Database linter advisory fixes
-- ============================================================
-- Resolves the actionable warnings from the Supabase linter:
--   1. function_search_path_mutable  (2 functions)
--   2. auth_rls_initplan             (24 policies: auth.uid() -> (select auth.uid()))
--   3. unindexed_foreign_keys        (14 missing FK indexes)
-- ============================================================

-- 1) Fix mutable search_path on functions
create or replace function public.generate_supply_order_number()
returns text
language sql
stable
set search_path = ''
as $$
  select 'SUP-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('public.supply_order_number_seq')::text, 6, '0');
$$;

create or replace function public.update_hero_content_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2) RLS init-plan fixes: wrap auth.uid() in (select auth.uid())
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select
  using (id = (select auth.uid()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update
  using (id = (select auth.uid()))
  with check ((id = (select auth.uid())) and role = 'customer');

drop policy if exists "sellers_select_own" on public.sellers;
create policy "sellers_select_own" on public.sellers for select
  using (user_id = (select auth.uid()));

drop policy if exists "sellers_insert_own" on public.sellers;
create policy "sellers_insert_own" on public.sellers for insert
  with check ((user_id = (select auth.uid())) and application_status = 'pending');

drop policy if exists "sellers_update_own_pending" on public.sellers;
create policy "sellers_update_own_pending" on public.sellers for update
  using ((user_id = (select auth.uid())) and application_status = 'pending')
  with check ((user_id = (select auth.uid())) and application_status = 'pending');

drop policy if exists "store_followers_insert_own" on public.store_followers;
create policy "store_followers_insert_own" on public.store_followers for insert
  with check (user_id = (select auth.uid()));

drop policy if exists "store_followers_delete_own" on public.store_followers;
create policy "store_followers_delete_own" on public.store_followers for delete
  using (user_id = (select auth.uid()));

drop policy if exists "wishlist_items_own" on public.wishlist_items;
create policy "wishlist_items_own" on public.wishlist_items for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "recently_viewed_own" on public.recently_viewed;
create policy "recently_viewed_own" on public.recently_viewed for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "carts_own" on public.carts;
create policy "carts_own" on public.carts for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "cart_items_own" on public.cart_items;
create policy "cart_items_own" on public.cart_items for all
  using (exists (select 1 from public.carts c where c.id = cart_items.cart_id and c.user_id = (select auth.uid())));

drop policy if exists "orders_select_buyer" on public.orders;
create policy "orders_select_buyer" on public.orders for select
  using (user_id = (select auth.uid()));

drop policy if exists "orders_insert_buyer" on public.orders;
create policy "orders_insert_buyer" on public.orders for insert
  with check (user_id = (select auth.uid()));

drop policy if exists "order_items_select_buyer" on public.order_items;
create policy "order_items_select_buyer" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = (select auth.uid())));

drop policy if exists "product_reviews_insert_own" on public.product_reviews;
create policy "product_reviews_insert_own" on public.product_reviews for insert
  with check ((user_id = (select auth.uid())) and status = 'approved');

drop policy if exists "product_reviews_update_own" on public.product_reviews;
create policy "product_reviews_update_own" on public.product_reviews for update
  using (user_id = (select auth.uid()));

drop policy if exists "product_reviews_delete_own" on public.product_reviews;
create policy "product_reviews_delete_own" on public.product_reviews for delete
  using (user_id = (select auth.uid()));

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications for select
  using (user_id = (select auth.uid()));

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications for update
  using (user_id = (select auth.uid()));

drop policy if exists "notifications_insert_own" on public.notifications;
create policy "notifications_insert_own" on public.notifications for insert
  with check (user_id = (select auth.uid()));

drop policy if exists "Sellers can read their messages" on public.messages;
create policy "Sellers can read their messages" on public.messages for select
  using (exists (select 1 from public.sellers s where s.user_id = (select auth.uid()) and s.application_status = 'approved' and (s.id = messages.seller_id or messages.is_bulk = true)));

drop policy if exists "Sellers can mark messages as read" on public.messages;
create policy "Sellers can mark messages as read" on public.messages for update
  using (exists (select 1 from public.sellers s where s.user_id = (select auth.uid()) and s.application_status = 'approved' and (s.id = messages.seller_id or messages.is_bulk = true)))
  with check (exists (select 1 from public.sellers s where s.user_id = (select auth.uid()) and s.application_status = 'approved' and (s.id = messages.seller_id or messages.is_bulk = true)));

drop policy if exists "Sellers read own withdrawal requests" on public.withdrawal_requests;
create policy "Sellers read own withdrawal requests" on public.withdrawal_requests for select
  using (exists (select 1 from public.sellers s where s.user_id = (select auth.uid()) and s.id = withdrawal_requests.seller_id));

drop policy if exists "Sellers create withdrawal requests" on public.withdrawal_requests;
create policy "Sellers create withdrawal requests" on public.withdrawal_requests for insert
  with check ((exists (select 1 from public.sellers s where s.user_id = (select auth.uid()) and s.id = withdrawal_requests.seller_id)) and status = 'pending');

-- 3) Indexes for unindexed foreign keys
create index if not exists cart_items_product_id_idx on public.cart_items (product_id);
create index if not exists commissions_order_id_idx on public.commissions (order_id);
create index if not exists coupons_seller_id_idx on public.coupons (seller_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id);
create index if not exists orders_coupon_id_idx on public.orders (coupon_id);
create index if not exists product_reviews_order_id_idx on public.product_reviews (order_id);
create index if not exists product_reviews_user_id_idx on public.product_reviews (user_id);
create index if not exists product_view_events_user_id_idx on public.product_view_events (user_id);
create index if not exists recently_viewed_product_id_idx on public.recently_viewed (product_id);
create index if not exists store_followers_user_id_idx on public.store_followers (user_id);
create index if not exists store_visits_user_id_idx on public.store_visits (user_id);
create index if not exists supply_order_items_product_id_idx on public.supply_order_items (product_id);
create index if not exists wallet_transactions_order_id_idx on public.wallet_transactions (order_id);
create index if not exists wishlist_items_product_id_idx on public.wishlist_items (product_id);
