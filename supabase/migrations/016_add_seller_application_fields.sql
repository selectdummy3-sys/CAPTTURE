-- Add address and document fields for seller application review.
alter table public.sellers
  add column if not exists proof_of_residence_url text,
  add column if not exists address_line1 text,
  add column if not exists city text,
  add column if not exists postal_code text;
