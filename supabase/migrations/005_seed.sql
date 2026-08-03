-- ============================================================
-- CAPPTURE — Seed data (demo accounts, categories, stores, products)
-- ============================================================

begin;

-- ---------- Demo account passwords ----------
-- admin@cappture.co.za  /  C@ptureAdmin!2026
-- seller accounts       /  C@ptureDemo!2026   (valency.apparel@demo.co.za,
--   khanyisa.threads@demo.co.za, peak.stitch@demo.co.za, mkhulu.shoes@demo.co.za,
--   sable.atelier@demo.co.za)
-- customer account      /  C@ptureDemo!2026   (nomsa.buyer@demo.co.za)
-- Change all demo passwords before going live.

-- ---------- Admin ----------
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
values (
  '00000000-0000-0000-0000-000000000000',
  '10000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated', 'admin@cappture.co.za',
  crypt('C@ptureAdmin!2026', gen_salt('bf', 10)),
  now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Platform Admin"}',
  now(), now(), '', ''
);

-- ---------- Demo customer ----------
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
values (
  '00000000-0000-0000-0000-000000000000',
  '10000000-0000-0000-0000-000000000020',
  'authenticated', 'authenticated', 'nomsa.buyer@demo.co.za',
  crypt('C@ptureDemo!2026', gen_salt('bf', 10)),
  now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Nomsa Dlamini"}',
  now(), now(), '', ''
);

-- ---------- Demo seller users ----------
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000010', 'authenticated', 'authenticated', 'valency.apparel@demo.co.za',     crypt('C@ptureDemo!2026', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sipho Vala"}',     now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000011', 'authenticated', 'authenticated', 'khanyisa.threads@demo.co.za',   crypt('C@ptureDemo!2026', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Amara Khanyisa"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000012', 'authenticated', 'authenticated', 'peak.stitch@demo.co.za',       crypt('C@ptureDemo!2026', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Jordan Nyoni"}',   now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000013', 'authenticated', 'authenticated', 'mkhulu.shoes@demo.co.za',      crypt('C@ptureDemo!2026', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Thabo Mkhulu"}',   now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000014', 'authenticated', 'authenticated', 'sable.atelier@demo.co.za',     crypt('C@ptureDemo!2026', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Leah Sable"}',     now(), now(), '', '');

-- Profiles are auto-created by the trigger; set roles.
update public.profiles set role = 'admin', full_name = 'Platform Admin' where id = '10000000-0000-0000-0000-000000000001';
update public.profiles set full_name = 'Nomsa Dlamini' where id = '10000000-0000-0000-0000-000000000020';
update public.profiles
set role = 'seller', full_name = case id
  when '10000000-0000-0000-0000-000000000010' then 'Sipho Vala'
  when '10000000-0000-0000-0000-000000000011' then 'Amara Khanyisa'
  when '10000000-0000-0000-0000-000000000012' then 'Jordan Nyoni'
  else full_name end
where id in ('10000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000012');
update public.profiles set full_name = 'Thabo Mkhulu' where id = '10000000-0000-0000-0000-000000000013';
update public.profiles set full_name = 'Leah Sable'   where id = '10000000-0000-0000-0000-000000000014';

-- ---------- Sellers ----------
insert into public.sellers (
  id, user_id, business_name, store_username, description, province, phone, email,
  logo_url, banner_url, social_links, bank_details, application_status,
  featured, commission_rate, approved_at, created_at
) values
  (
    '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000010',
    'Valency Apparel', 'valency',
    'Johannesburg-based streetwear label. Heavyweight cotton, clean cuts, no noise. Designed and printed in Joburg.',
    'Gauteng', '+27 82 555 0101', 'valency.apparel@demo.co.za',
    'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1600&q=80',
    '{"instagram":"@valency.apparel","tiktok":"@valency.apparel"}',
    '{"bank_name":"Example Bank","account_holder":"Valency Apparel","account_number":"0000000000","branch_code":"000000"}',
    'approved', true, 0.06, now() - interval '200 days', now() - interval '200 days'
  ),
  (
    '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000011',
    'Khanyisa Threads', 'khanyisa',
    'Hand-finished womenswear inspired by the KwaZulu-Natal coast. Small-batch, natural fibres, made in Durban.',
    'KwaZulu-Natal', '+27 82 555 0102', 'khanyisa.threads@demo.co.za',
    'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1600&q=80',
    '{"instagram":"@khanyisa.threads"}',
    '{"bank_name":"Example Bank","account_holder":"Khanyisa Threads","account_number":"0000000000","branch_code":"000000"}',
    'approved', false, null, now() - interval '150 days', now() - interval '150 days'
  ),
  (
    '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000012',
    'Peak Stitch', 'peakstitch',
    'Footwear and accessories engineered for the Cape Town mountains. Grippy, durable, built for the coast-to-kloof commute.',
    'Western Cape', '+27 82 555 0103', 'peak.stitch@demo.co.za',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1600&q=80',
    '{"instagram":"@peak.stitch","tiktok":"@peakstitch_sa"}',
    '{"bank_name":"Example Bank","account_holder":"Peak Stitch","account_number":"0000000000","branch_code":"000000"}',
    'approved', true, 0.07, now() - interval '90 days', now() - interval '90 days'
  ),
  (
    '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000013',
    'Mkhulu Footwear', 'mkhulu',
    'Handmade leather brogues and loafers from a small Polokwane workshop.',
    'Limpopo', '+27 82 555 0104', 'mkhulu.shoes@demo.co.za',
    null, null,
    '{"instagram":"@mkhulu.footwear"}',
    '{"bank_name":"","account_holder":"","account_number":"","branch_code":""}',
    'pending', false, null, null, now() - interval '2 days'
  ),
  (
    '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000014',
    'Sable Atelier', 'sable',
    'Custom tailoring studio.',
    'Gauteng', '+27 82 555 0105', 'sable.atelier@demo.co.za',
    null, null,
    '{}',
    '{"bank_name":"","account_holder":"","account_number":"","branch_code":""}',
    'rejected', false, null, null, now() - interval '10 days'
  );

-- ---------- Categories ----------
insert into public.categories (id, name, slug, description, image_url, parent_id, is_active, sort_order) values
  ('30000000-0000-0000-0000-000000000001', 'Men',     'men',     'Men''s fashion',     'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80', null, true, 1),
  ('30000000-0000-0000-0000-000000000002', 'Women',   'women',   'Women''s fashion',   'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80', null, true, 2),
  ('30000000-0000-0000-0000-000000000003', 'Kids',    'kids',    'Little ones',        'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=800&q=80', null, true, 3),
  ('30000000-0000-0000-0000-000000000004', 'Shoes',   'shoes',   'Sneakers & more',    'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80', null, true, 4),
  ('30000000-0000-0000-0000-000000000005', 'Accessories', 'accessories', 'Bags, caps & extras', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80', null, true, 5),
  ('30000000-0000-0000-0000-000000000011', 'T-Shirts', 'tshirts', 'Everyday tees',      null, '30000000-0000-0000-0000-000000000001', true, 1),
  ('30000000-0000-0000-0000-000000000012', 'Hoodies', 'hoodies', 'Layers',             null, '30000000-0000-0000-0000-000000000001', true, 2),
  ('30000000-0000-0000-0000-000000000013', 'Jeans',   'jeans',   'Denim',              null, '30000000-0000-0000-0000-000000000001', true, 3),
  ('30000000-0000-0000-0000-000000000014', 'Dresses', 'dresses', 'Dresses',            null, '30000000-0000-0000-0000-000000000002', true, 1),
  ('30000000-0000-0000-0000-000000000015', 'Tops',    'tops',    'Tops',               null, '30000000-0000-0000-0000-000000000002', true, 2),
  ('30000000-0000-0000-0000-000000000016', 'Skirts',  'skirts',  'Skirts',             null, '30000000-0000-0000-0000-000000000002', true, 3),
  ('30000000-0000-0000-0000-000000000017', 'Sneakers','sneakers','Sneakers',           null, '30000000-0000-0000-0000-000000000004', true, 1),
  ('30000000-0000-0000-0000-000000000018', 'Sandals', 'sandals', 'Sandals & slides',   null, '30000000-0000-0000-0000-000000000004', true, 2),
  ('30000000-0000-0000-0000-000000000019', 'Bags',    'bags',    'Bags',               null, '30000000-0000-0000-0000-000000000005', true, 1),
  ('30000000-0000-0000-0000-000000000020', 'Caps & Hats', 'caps', 'Headwear',          null, '30000000-0000-0000-0000-000000000005', true, 2);

-- ---------- Platform settings ----------
insert into public.platform_settings (key, value) values
  ('site',       '{"name":"CAPPTURE","tagline":"South Africa''s marketplace for independent fashion brands","currency":"ZAR"}'),
  ('commission', '{"rate":0.08}'),
  ('shipping',   '{"base_fee":60,"free_above":1000}'),
  ('payments',   '{"methods":["cod","eft"],"eft_details":"CAPPTURE Marketplace, Account 0000000000, Branch 000000, Reference: your order number"}');

-- ---------- Coupons ----------
insert into public.coupons (id, seller_id, code, description, discount_type, discount_value, min_order_amount, usage_limit, is_active, starts_at, ends_at) values
  ('50000000-0000-0000-0000-000000000001', null, 'WELCOME10', '10% off your first order', 'percentage', 10, 0, 500, true, now() - interval '1 day', now() + interval '90 days'),
  ('50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'VALENCY5', '5% off Valency Apparel', 'percentage', 5, 400, 200, true, now() - interval '1 day', now() + interval '60 days');

-- ---------- Products ----------
insert into public.products (
  id, seller_id, category_id, name, slug, description, price, sale_price, stock, sku, weight,
  material, gender, sizes, colours, tags, featured_image, status, is_flash_sale, flash_sale_ends_at, view_count, created_at
) values
  (
    '40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000011',
    'Monogram Heavyweight Tee', 'monogram-heavyweight-tee',
    'A 240gsm ring-spun cotton tee with tonal chest monogram. Pre-shrunk, boxy fit, finished with a ribbed collar.',
    450, 360, 84, 'VAL-TEE-001', 0.28, '100% ring-spun cotton',
    'men', array['XS','S','M','L','XL'], array['Black','White','Sand'], array['streetwear','tee','cotton','jhb'],
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
    'published', true, now() + interval '3 days', 1240, now() - interval '180 days'
  ),
  (
    '40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000012',
    'Court Street Hoodie', 'court-street-hoodie',
    'Brushed-back fleece hoodie with dropped shoulders and a kangaroo pocket. Garment-dyed for a lived-in finish.',
    980, null, 41, 'VAL-HD-002', 0.72, '80% cotton, 20% polyester',
    'men', array['S','M','L','XL','XXL'], array['Charcoal','Sand'], array['hoodie','fleece','layer'],
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=80',
    'published', false, null, 860, now() - interval '150 days'
  ),
  (
    '40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000013',
    'Selvedge Straight Jeans', 'selvedge-straight-jeans',
    'Raw selvedge denim, straight leg. Fades in with wear. Made from Japanese 13oz denim.',
    1290, 1032, 27, 'VAL-JN-003', 0.95, '13oz Japanese selvedge denim',
    'men', array['30','31','32','33','34','36','38'], array['Indigo','Black'], array['denim','selvedge','jeans'],
    'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=80',
    'published', false, null, 1430, now() - interval '160 days'
  ),
  (
    '40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000011',
    'Oversized Heritage Tee', 'oversized-heritage-tee',
    'Relaxed oversized tee with a screen-printed heritage mark on the back panel.',
    520, null, 0, 'VAL-TEE-004', 0.3, '100% combed cotton',
    'unisex', array['S','M','L','XL'], array['Black','White'], array['oversized','graphic'],
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=80',
    'draft', false, null, 0, now() - interval '12 days'
  ),
  (
    '40000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000019',
    'Canvas Weekender Bag', 'canvas-weekender-bag',
    'Waxed canvas weekender with leather trims, a padded laptop sleeve and brass hardware.',
    890, null, 18, 'VAL-BG-005', 1.1, 'Waxed canvas, leather trims',
    'unisex', array['One Size'], array['Olive','Black'], array['bag','canvas','travel'],
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80',
    'draft', false, null, 0, now() - interval '8 days'
  ),
  (
    '40000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000014',
    'Indigo Wrap Dress', 'indigo-wrap-dress',
    'A fluid wrap dress in deep indigo with tie-waist detail. Breathable viscose, made in small batches in Durban.',
    1150, 920, 33, 'KHT-DR-001', 0.4, '100% viscose',
    'women', array['XS','S','M','L'], array['Indigo','Olive'], array['dress','wrap','indigo','natural'],
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80',
    'published', true, now() + interval '5 days', 1130, now() - interval '120 days'
  ),
  (
    '40000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000015',
    'Bamboo Rib Tank', 'bamboo-rib-tank',
    'Slim-fit ribbed tank in breathable bamboo viscose. Layers cleanly under everything.',
    420, null, 64, 'KHT-TP-002', 0.15, 'Bamboo viscose blend',
    'women', array['XS','S','M','L','XL'], array['Black','White','Terracotta'], array['tank','rib','bamboo'],
    'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=1200&q=80',
    'published', false, null, 720, now() - interval '130 days'
  ),
  (
    '40000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000016',
    'Pleat Midi Skirt', 'pleat-midi-skirt',
    'A midi skirt with permanent knife pleats and a smooth waistband. Swings as you walk.',
    760, null, 22, 'KHT-SK-003', 0.35, 'Polyester-viscose blend',
    'women', array['XS','S','M','L'], array['Charcoal','Sage'], array['skirt','midi','pleat'],
    'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=1200&q=80',
    'published', false, null, 510, now() - interval '110 days'
  ),
  (
    '40000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000015',
    'Umhlanga Knot Top', 'umhlanga-knot-top',
    'Crop top with a front knot and soft ruching. Named after the reeds of Umhlanga.',
    540, null, 0, 'KHT-TP-004', 0.18, 'Cotton-elastane',
    'women', array['XS','S','M'], array['White','Terracotta'], array['crop','knot','summer'],
    'https://images.unsplash.com/photo-1515372039744-b8f02f3aae2a?auto=format&fit=crop&w=1200&q=80',
    'archived', false, null, 0, now() - interval '90 days'
  ),
  (
    '40000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000017',
    'Arc Runner Sneaker', 'arc-runner-sneaker',
    'A lightweight road runner with a responsive foam midsole and breathable engineered mesh upper.',
    1500, 1275, 38, 'PKS-SN-001', 0.62, 'Engineered mesh, rubber outsole',
    'men', array['UK7','UK8','UK9','UK10','UK11'], array['Cloud','Black'], array['sneaker','runner','foam'],
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=80',
    'published', true, now() + interval '2 days', 1670, now() - interval '80 days'
  ),
  (
    '40000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000018',
    'Coastal Slide Sandal', 'coastal-slide-sandal',
    'Moulded footbed slide with a contoured arch. The beach-to-street essential.',
    620, null, 52, 'PKS-SD-002', 0.3, 'EVA foam',
    'unisex', array['UK7','UK8','UK9','UK10'], array['Black','Sand'], array['slide','sandals','coastal'],
    'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=1200&q=80',
    'published', false, null, 410, now() - interval '70 days'
  ),
  (
    '40000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000017',
    'Trail Flex Low', 'trail-flex-low',
    'Low-profile trail shoe with a grippy lugged outsole for the mountain paths.',
    1350, null, 0, 'PKS-SN-003', 0.68, 'Knit upper, lugged rubber',
    'men', array['UK7','UK8','UK9','UK10','UK11'], array['Cape','Grey'], array['trail','hiking','grip'],
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1200&q=80',
    'draft', false, null, 0, now() - interval '20 days'
  ),
  (
    '40000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000020',
    'Signature Bucket Hat', 'signature-bucket-hat',
    'Washed cotton bucket hat with a woven label. UV-protective and packable.',
    480, null, 96, 'PKS-HT-004', 0.09, '100% cotton',
    'unisex', array['One Size'], array['Black','Sand','Olive'], array['bucket','hat','sun'],
    'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1200&q=80',
    'published', false, null, 380, now() - interval '60 days'
  ),
  (
    '40000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000019',
    'Mini Shoulder Bag', 'mini-shoulder-bag',
    'A compact crossbody with a card pocket and adjustable strap. Fits the essentials.',
    950, null, 44, 'PKS-BG-005', 0.22, 'Nylon, metal hardware',
    'women', array['One Size'], array['Black','Bone'], array['bag','crossbody','mini'],
    'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1200&q=80',
    'published', false, null, 690, now() - interval '55 days'
  );

-- ---------- Product images ----------
insert into public.product_images (product_id, url, alt, sort_order) values
  ('40000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80', 'Monogram tee front', 0),
  ('40000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1200&q=80', 'Monogram tee detail', 1),
  ('40000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=80', 'Monogram tee back', 2),
  ('40000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=80', 'Court Street hoodie', 0),
  ('40000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1200&q=80', 'Hoodie detail', 1),
  ('40000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=80', 'Selvedge jeans', 0),
  ('40000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=80', 'Jeans wash', 1),
  ('40000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80', 'Indigo wrap dress', 0),
  ('40000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1515372039744-b8f02f3aae2a?auto=format&fit=crop&w=1200&q=80', 'Dress detail', 1),
  ('40000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=1200&q=80', 'Bamboo rib tank', 0),
  ('40000000-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=1200&q=80', 'Pleat midi skirt', 0),
  ('40000000-0000-0000-0000-000000000010', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=80', 'Arc runner side', 0),
  ('40000000-0000-0000-0000-000000000010', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1200&q=80', 'Arc runner sole', 1),
  ('40000000-0000-0000-0000-000000000011', 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=1200&q=80', 'Coastal slide', 0),
  ('40000000-0000-0000-0000-000000000013', 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1200&q=80', 'Bucket hat', 0),
  ('40000000-0000-0000-0000-000000000014', 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1200&q=80', 'Mini shoulder bag', 0);

-- ---------- Followers ----------
insert into public.store_followers (seller_id, user_id) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000020'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000020'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000020');

-- ---------- Demo orders + commissions + review ----------
insert into public.orders (id, user_id, seller_id, status, payment_method, payment_status, subtotal, discount, shipping, total, shipping_address, delivered_at, created_at) values
  ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000020', '20000000-0000-0000-0000-000000000001', 'delivered', 'cod', 'paid', 1500, 75, 60, 1485,
   '{"recipient":"Nomsa Dlamini","phone":"+27 82 555 0201","line1":"12 Long Street","city":"Johannesburg","province":"Gauteng","postal_code":"2001"}',
   now() - interval '14 days', now() - interval '24 days'),
  ('60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000020', '20000000-0000-0000-0000-000000000002', 'shipped', 'eft', 'pending_confirmation', 1080, 0, 60, 1140,
   '{"recipient":"Nomsa Dlamini","phone":"+27 82 555 0201","line1":"12 Long Street","city":"Johannesburg","province":"Gauteng","postal_code":"2001"}',
   null, now() - interval '5 days'),
  ('60000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000020', '20000000-0000-0000-0000-000000000003', 'pending', 'cod', 'paid', 2120, 0, 60, 2180,
   '{"recipient":"Nomsa Dlamini","phone":"+27 82 555 0201","line1":"12 Long Street","city":"Johannesburg","province":"Gauteng","postal_code":"2001"}',
   null, now() - interval '1 day');

insert into public.order_items (order_id, product_id, seller_id, product_name, product_image, price, quantity, size, colour, line_total) values
  ('60000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Selvedge Straight Jeans', 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=80', 1032, 1, '32', 'Indigo', 1032),
  ('60000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Court Street Hoodie', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=80', 468, 1, 'L', 'Charcoal', 468),
  ('60000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000002', 'Indigo Wrap Dress', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80', 920, 1, 'M', 'Indigo', 920),
  ('60000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000002', 'Bamboo Rib Tank', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=1200&q=80', 160, 1, 'S', 'Black', 160),
  ('60000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000003', 'Arc Runner Sneaker', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=80', 1275, 1, 'UK9', 'Cloud', 1275),
  ('60000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000003', 'Mini Shoulder Bag', 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1200&q=80', 845, 1, 'One Size', 'Black', 845);

insert into public.commissions (seller_id, order_id, rate, amount, status, paid_at, created_at) values
  ('20000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 0.06, 89.10, 'paid', now() - interval '12 days', now() - interval '24 days'),
  ('20000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002', 0.08, 91.20, 'pending', null, now() - interval '5 days'),
  ('20000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000003', 0.07, 152.60, 'pending', null, now() - interval '1 day');

insert into public.product_reviews (product_id, user_id, order_id, rating, title, body, status, created_at) values
  ('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000020', '60000000-0000-0000-0000-000000000001', 5, 'Incredible fade', 'Quality denim, fits true to size. Fading beautifully after a month.', 'approved', now() - interval '12 days'),
  ('40000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000020', '60000000-0000-0000-0000-000000000002', 4, 'Lovely fabric', 'Beautiful colour and drape. Runs slightly large.', 'approved', now() - interval '4 days');

commit;
