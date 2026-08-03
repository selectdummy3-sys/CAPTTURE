-- ============================================================
-- CAPPTURE — Remove public coupon read
-- ============================================================
-- Regression: `coupons_select_public` used `using (true)`, exposing
-- discount codes to anonymous users. Coupons are only validated
-- server-side inside the SECURITY DEFINER `place_order` (which bypasses
-- RLS), so no client-side read is required. Sellers manage their own
-- coupons via `coupons_write_owner`; admins via `coupons_write_admin`.

drop policy if exists "coupons_select_public" on public.coupons;
