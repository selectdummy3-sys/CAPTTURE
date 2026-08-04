-- ============================================================
-- CAPPTURE — Add tracking number to orders
-- ============================================================

alter table public.orders add column if not exists tracking_number text;
