-- ============================================================
-- Brand spelling fix: CAPTTURE (not CAPPTURE) + "store" positioning
-- ============================================================

begin;

update public.platform_settings
set value = jsonb_set(value, '{name}', '"CAPTTURE"'),
    updated_at = now()
where key = 'site';

update public.platform_settings
set value = jsonb_set(value, '{tagline}', '"South Africa''s store for independent fashion brands"'),
    updated_at = now()
where key = 'site';

update public.platform_settings
set value = jsonb_set(value, '{eft_details}', '"CAPTTURE Store, Account 0000000000, Branch 000000, Reference: your order number"'),
    updated_at = now()
where key = 'payments';

update public.payfast_config
set merchant_name = 'CAPTTURE'
where merchant_name = 'CAPPTURE';

update public.notifications
set title = replace(title, 'CAPPTURE', 'CAPTTURE'),
    body  = replace(body, 'CAPPTURE', 'CAPTTURE')
where title ilike '%CAPPTURE%' or body ilike '%CAPPTURE%';

commit;