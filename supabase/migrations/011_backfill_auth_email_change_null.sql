-- ============================================================
-- CAPPTURE — Backfill NULL auth token columns
-- ============================================================
-- GoTrue v2.x fails password login for seeded users with
-- "Scan error on column index 8, name \"email_change\": converting NULL
-- to string is unsupported". Seeded auth.users rows have NULL in the
-- change-token columns that GoTrue scans as strings.

update auth.users
set email_change = coalesce(email_change, ''),
    email_change_token_new = coalesce(email_change_token_new, ''),
    phone_change = coalesce(phone_change, '')
where email_change is null
   or email_change_token_new is null
   or phone_change is null;
