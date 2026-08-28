-- Consolidate place_order overloads. Only the canonical signature
-- (p_delivery_method / p_pep_store_id / p_pep_delivery_tier) should exist
-- so PostgREST / supabase-js can resolve the RPC unambiguously.
drop function if exists public.place_order(uuid, jsonb, text, jsonb, jsonb, text, text);
drop function if exists public.place_order(uuid, jsonb, text, jsonb, jsonb, text, text, text, uuid);