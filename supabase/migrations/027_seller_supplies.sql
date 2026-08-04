-- ============================================================
-- CAPPTURE — Seller Supplies (B2B store for registered sellers)
-- A catalogue of branding / packaging / equipment / printing /
-- business-resource products + a B2B order pipeline. Open to all
-- registered sellers (any application status), managed by admins.
-- ============================================================

begin;

-- ---------- Helpers ----------

-- Current seller id regardless of application status.
create or replace function public.current_seller_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.sellers where user_id = auth.uid() limit 1;
$$;

-- True when the caller has a seller row (any status).
create or replace function public.is_seller_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.sellers where user_id = auth.uid());
$$;

-- ---------- supply_categories ----------
create table public.supply_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger supply_categories_updated_at
  before update on public.supply_categories
  for each row execute procedure public.handle_updated_at();

-- ---------- supply_couriers ----------
create table public.supply_couriers (
  id             uuid primary key default gen_random_uuid(),
  name           text not null unique,
  fee            numeric(12, 2) not null default 0 check (fee >= 0),
  estimated_days integer not null default 3 check (estimated_days > 0),
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger supply_couriers_updated_at
  before update on public.supply_couriers
  for each row execute procedure public.handle_updated_at();

-- ---------- supply_products ----------
-- type: physical (shipped) | digital (instant download) | service (booked)
create table public.supply_products (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  slug           text not null unique,
  category_id    uuid references public.supply_categories (id) on delete set null,
  type           text not null default 'physical'
                 check (type in ('physical', 'digital', 'service')),
  description    text,
  price          numeric(12, 2) not null check (price >= 0),
  sale_price     numeric(12, 2) check (sale_price is null or sale_price >= 0),
  stock          integer check (stock is null or stock >= 0),
  sku            text,
  delivery_days  integer check (delivery_days is null or delivery_days > 0),
  specifications jsonb not null default '{}'::jsonb,
  featured_image text,
  images         text[] not null default '{}',
  is_active      boolean not null default true,
  view_count     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index supply_products_category_idx on public.supply_products (category_id);
create index supply_products_created_at_idx on public.supply_products (created_at desc);
create index supply_products_name_idx on public.supply_products using gin (name gin_trgm_ops);
create index supply_products_active_idx on public.supply_products (is_active);

create trigger supply_products_updated_at
  before update on public.supply_products
  for each row execute procedure public.handle_updated_at();

-- ---------- supply_orders ----------
create sequence public.supply_order_number_seq start 2000;

create or replace function public.generate_supply_order_number()
returns text
language sql
stable
as $$
  select 'SUP-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('public.supply_order_number_seq')::text, 6, '0');
$$;

create table public.supply_orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique default public.generate_supply_order_number(),
  seller_id        uuid not null references public.sellers (id),
  status           text not null default 'pending'
                   check (status in ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_method   text not null default 'online'
                   check (payment_method in ('online', 'eft')),
  payment_status   text not null default 'unpaid'
                   check (payment_status in ('unpaid', 'pending_confirmation', 'paid')),
  subtotal         numeric(12, 2) not null default 0,
  delivery_fee     numeric(12, 2) not null default 0,
  total            numeric(12, 2) not null default 0,
  courier          text,
  shipping_address jsonb not null default '{}'::jsonb,
  tracking_number  text,
  notes            text,
  delivered_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index supply_orders_seller_idx on public.supply_orders (seller_id, created_at desc);
create index supply_orders_status_idx on public.supply_orders (status);

create trigger supply_orders_updated_at
  before update on public.supply_orders
  for each row execute procedure public.handle_updated_at();

-- ---------- supply_order_items ----------
create table public.supply_order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.supply_orders (id) on delete cascade,
  product_id    uuid references public.supply_products (id) on delete set null,
  product_name  text not null,
  product_image text,
  price         numeric(12, 2) not null,
  quantity      integer not null check (quantity > 0),
  line_total    numeric(12, 2) not null
);

create index supply_order_items_order_idx on public.supply_order_items (order_id);

-- ---------- RLS ----------
alter table public.supply_categories enable row level security;
alter table public.supply_couriers enable row level security;
alter table public.supply_products enable row level security;
alter table public.supply_orders enable row level security;
alter table public.supply_order_items enable row level security;

create policy "supply_categories_select_sellers" on public.supply_categories for select
  using (public.is_seller_user() and is_active = true);
create policy "supply_categories_select_admin" on public.supply_categories for select
  using (public.is_admin());
create policy "supply_categories_write_admin" on public.supply_categories for all
  using (public.is_admin());

create policy "supply_couriers_select_sellers" on public.supply_couriers for select
  using (public.is_seller_user() and is_active = true);
create policy "supply_couriers_select_admin" on public.supply_couriers for select
  using (public.is_admin());
create policy "supply_couriers_write_admin" on public.supply_couriers for all
  using (public.is_admin());

create policy "supply_products_select_sellers" on public.supply_products for select
  using (public.is_seller_user() and is_active = true);
create policy "supply_products_select_admin" on public.supply_products for select
  using (public.is_admin());
create policy "supply_products_write_admin" on public.supply_products for all
  using (public.is_admin());

create policy "supply_orders_select_own" on public.supply_orders for select
  using (
    public.current_seller_id() is not null
    and seller_id = public.current_seller_id()
  );
create policy "supply_orders_select_admin" on public.supply_orders for select
  using (public.is_admin());
create policy "supply_orders_insert_own" on public.supply_orders for insert
  with check (
    public.current_seller_id() is not null
    and seller_id = public.current_seller_id()
  );
create policy "supply_orders_update_admin" on public.supply_orders for update
  using (public.is_admin());

create policy "supply_order_items_select_own" on public.supply_order_items for select
  using (
    exists (
      select 1 from public.supply_orders o
      where o.id = supply_order_items.order_id
        and public.current_seller_id() is not null
        and o.seller_id = public.current_seller_id()
    )
  );
create policy "supply_order_items_select_admin" on public.supply_order_items for select
  using (public.is_admin());

-- ---------- place_supply_order ----------
create or replace function public.place_supply_order(
  p_items            jsonb,
  p_shipping_address jsonb,
  p_courier_id       uuid,
  p_payment_method   text default 'online',
  p_notes            text default null
)
returns public.supply_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id     uuid;
  v_item          jsonb;
  v_product       public.supply_products%rowtype;
  v_courier       public.supply_couriers%rowtype;
  v_qty           integer;
  v_unit_price    numeric(12, 2);
  v_subtotal      numeric(12, 2) := 0;
  v_delivery_fee  numeric(12, 2) := 0;
  v_has_physical  boolean := false;
  v_order_id      uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select id into v_seller_id from public.sellers where user_id = auth.uid() limit 1;
  if not found then
    raise exception 'seller account required';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'order has no items';
  end if;

  if p_payment_method not in ('online', 'eft') then
    raise exception 'unsupported payment method';
  end if;

  -- Validate items, lock product rows, snapshot prices.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product
    from public.supply_products
    where id = (v_item ->> 'product_id')::uuid
    for update;

    if not found then
      raise exception 'product not found';
    end if;
    if not v_product.is_active then
      raise exception 'product "%" is not available', v_product.name;
    end if;

    v_qty := coalesce((v_item ->> 'quantity')::integer, 0);
    if v_qty < 1 then
      raise exception 'invalid quantity';
    end if;

    if v_product.type = 'physical' then
      v_has_physical := true;
      if v_product.stock is null or v_product.stock < v_qty then
        raise exception 'only % left in stock for "%"', coalesce(v_product.stock, 0), v_product.name;
      end if;
    end if;

    v_unit_price := coalesce(v_product.sale_price, v_product.price);
    v_subtotal   := v_subtotal + (v_unit_price * v_qty);
  end loop;

  -- Courier + delivery fee (only charged when a physical item ships).
  if v_has_physical then
    select * into v_courier
    from public.supply_couriers
    where id = p_courier_id and is_active = true;
    if not found then
      raise exception 'courier is not available';
    end if;
    v_delivery_fee := v_courier.fee;
  end if;

  insert into public.supply_orders (
    seller_id, payment_method, payment_status, subtotal, delivery_fee, total,
    courier, shipping_address, notes
  ) values (
    v_seller_id, p_payment_method,
    case when p_payment_method = 'online' then 'paid' else 'pending_confirmation' end,
    v_subtotal, v_delivery_fee, v_subtotal + v_delivery_fee,
    case when v_has_physical then v_courier.name else null end,
    coalesce(p_shipping_address, '{}'::jsonb), p_notes
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product from public.supply_products where id = (v_item ->> 'product_id')::uuid;
    v_qty        := coalesce((v_item ->> 'quantity')::integer, 0);
    v_unit_price := coalesce(v_product.sale_price, v_product.price);

    insert into public.supply_order_items (
      order_id, product_id, product_name, product_image, price, quantity, line_total
    ) values (
      v_order_id, v_product.id, v_product.name, v_product.featured_image,
      v_unit_price, v_qty, v_unit_price * v_qty
    );

    if v_product.type = 'physical' then
      update public.supply_products set stock = stock - v_qty where id = v_product.id;
    end if;
  end loop;

  return (select s from public.supply_orders s where s.id = v_order_id);
end;
$$;

revoke all on function public.place_supply_order(jsonb, jsonb, uuid, text, text) from public;
grant execute on function public.place_supply_order(jsonb, jsonb, uuid, text, text) to authenticated;

-- ---------- get_supply_stats (admin) ----------
create or replace function public.get_supply_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_stats jsonb;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  select jsonb_build_object(
    'totalRevenue',   coalesce(sum(total), 0),
    'totalOrders',    count(*),
    'paidOrders',     count(*) filter (where payment_status = 'paid'),
    'pendingOrders',  count(*) filter (where status not in ('delivered', 'cancelled', 'refunded')),
    'revenue30d',     coalesce(sum(total) filter (where created_at >= now() - interval '30 days'), 0),
    'productsCount',  (select count(*) from public.supply_products),
    'activeProducts', (select count(*) from public.supply_products where is_active),
    'lowStockCount',  (select count(*) from public.supply_products
                        where is_active and type = 'physical' and stock is not null and stock <= 5),
    'categoriesCount', (select count(*) from public.supply_categories where is_active)
  ) into v_stats
  from public.supply_orders;

  return v_stats;
end;
$$;

revoke all on function public.get_supply_stats() from public;
grant execute on function public.get_supply_stats() to authenticated;

-- ============================================================
-- Seed
-- ============================================================

-- ---------- Categories ----------
insert into public.supply_categories (id, name, slug, description, image_url, sort_order) values
  ('71000000-0000-0000-0000-000000000001', 'Branding', 'branding',
   'Tags, labels and everything that puts your name on your clothes.',
   'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=900&q=80', 1),
  ('71000000-0000-0000-0000-000000000002', 'Packaging', 'packaging',
   'Bags, boxes and unboxing extras that make every order feel premium.',
   'https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=900&q=80', 2),
  ('71000000-0000-0000-0000-000000000003', 'Equipment', 'equipment',
   'Tools for tagging, measuring and cutting.',
   'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=900&q=80', 3),
  ('71000000-0000-0000-0000-000000000004', 'Printing', 'printing',
   'Stickers and printed extras for your products and marketing.',
   'https://images.unsplash.com/photo-1563203369-26f2e4a5ccf7?auto=format&fit=crop&w=900&q=80', 4),
  ('71000000-0000-0000-0000-000000000005', 'Business Resources', 'resources',
   'Templates, mockups and guides to grow your brand.',
   'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80', 5)
on conflict (slug) do nothing;

-- ---------- Couriers ----------
insert into public.supply_couriers (id, name, fee, estimated_days, is_active) values
  ('72000000-0000-0000-0000-000000000001', 'The Courier Guy', 95.00, 2, true),
  ('72000000-0000-0000-0000-000000000002', 'Dawn Wing',        120.00, 1, true),
  ('72000000-0000-0000-0000-000000000003', 'Fastway Couriers', 110.00, 3, true),
  ('72000000-0000-0000-0000-000000000004', 'Pargo',             85.00, 4, true)
on conflict (name) do nothing;

-- ---------- Products ----------
insert into public.supply_products (
  id, name, slug, category_id, type, description, price, sale_price,
  stock, sku, delivery_days, specifications, featured_image, images, is_active, view_count
) values
-- Branding
  ('73000000-0000-0000-0000-000000000001', 'Custom Woven Labels', 'custom-woven-labels',
   '71000000-0000-0000-0000-000000000001', 'physical',
   'Premium woven neck labels with your logo woven in. Perfect for t-shirts, hoodies and jackets.',
   480.00, 420.00, 200, 'BR-WOV-001', 10,
   '{"Material":"Polyester taffeta","Options":"Satin / cotton","Min order":"500","Size":"20 x 35 mm"}'::jsonb,
   'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=900&q=80',
   '{"https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=900&q=80"}'::text[], true, 120),
  ('73000000-0000-0000-0000-000000000002', 'Hang Tags (500)', 'hang-tags',
   '71000000-0000-0000-0000-000000000001', 'physical',
   'Thick, matte-finish hang tags printed on both sides. Add a string or elastic loop for a polished look.',
   350.00, null, 300, 'BR-HTG-002', 7,
   '{"Material":"300gsm card","Finish":"Matte","Min order":"500","Size":"55 x 90 mm"}'::jsonb,
   'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?auto=format&fit=crop&w=900&q=80',
   '{"https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?auto=format&fit=crop&w=900&q=80"}'::text[], true, 98),
  ('73000000-0000-0000-0000-000000000003', 'Printed Labels (1000)', 'printed-labels',
   '71000000-0000-0000-0000-000000000001', 'physical',
   'Wash-proof printed labels for inner seams. Great for smaller batches and flexible designs.',
   290.00, null, 300, 'BR-PRL-003', 7,
   '{"Material":"Satin ribbon","Finish":"Gloss","Min order":"1000","Size":"25 x 40 mm"}'::jsonb,
   'https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?auto=format&fit=crop&w=900&q=80',
   '{"https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?auto=format&fit=crop&w=900&q=80"}'::text[], true, 76),
  ('73000000-0000-0000-0000-000000000004', 'Neck Labels (500)', 'neck-labels',
   '71000000-0000-0000-0000-000000000001', 'physical',
   'Soft-touch neck labels that sit comfortably against the skin.',
   320.00, null, 250, 'BR-NCK-004', 8,
   '{"Material":"Polyester satin","Min order":"500","Size":"35 x 15 mm"}'::jsonb,
   'https://images.unsplash.com/photo-1509762774605-f07235a08f1f?auto=format&fit=crop&w=900&q=80',
   '{"https://images.unsplash.com/photo-1509762774605-f07235a08f1f?auto=format&fit=crop&w=900&q=80"}'::text[], true, 65),
  ('73000000-0000-0000-0000-000000000005', 'Size Labels (1000)', 'size-labels',
   '71000000-0000-0000-0000-000000000001', 'physical',
   'Size label sets (XS–XXL) printed on soft, colour-fast ribbon.',
   260.00, null, 400, 'BR-SZL-005', 7,
   '{"Material":"Satin","Sizes":"XS-XXL","Min order":"1000"}'::jsonb,
   'https://images.unsplash.com/photo-1598452963314-b09f397a5c48?auto=format&fit=crop&w=900&q=80',
   '{"https://images.unsplash.com/photo-1598452963314-b09f397a5c48?auto=format&fit=crop&w=900&q=80"}'::text[], true, 54),
  ('73000000-0000-0000-0000-000000000006', 'Care Labels (1000)', 'care-labels',
   '71000000-0000-0000-0000-000000000001', 'physical',
   'Washing, drying and ironing instruction labels that stay readable wash after wash.',
   280.00, null, 350, 'BR-CRL-006', 8,
   '{"Material":"Nylon","Min order":"1000","Size":"20 x 50 mm"}'::jsonb,
   'https://images.unsplash.com/photo-1523380744952-b7e209e79760?auto=format&fit=crop&w=900&q=80',
   '{"https://images.unsplash.com/photo-1523380744952-b7e209e79760?auto=format&fit=crop&w=900&q=80"}'::text[], true, 41),
-- Packaging
  ('73000000-0000-0000-0000-000000000007', 'Paper Carrier Bags (250)', 'paper-carrier-bags',
   '71000000-0000-0000-0000-000000000002', 'physical',
   'Kraft carrier bags with rope handles, printed with your logo. The classic boutique finish.',
   850.00, 720.00, 120, 'PK-PCB-007', 10,
   '{"Material":"140gsm kraft","Handle":"Rope","Min order":"250","Sizes":"S / M / L"}'::jsonb,
   'https://images.unsplash.com/photo-1553531384-cc64ac80f931?auto=format&fit=crop&w=900&q=80',
   '{"https://images.unsplash.com/photo-1553531384-cc64ac80f931?auto=format&fit=crop&w=900&q=80"}'::text[], true, 88),
  ('73000000-0000-0000-0000-000000000008', 'Courier Bags (100)', 'courier-bags',
   '71000000-0000-0000-0000-000000000002', 'physical',
   'Waterproof poly mailers that keep garments protected in transit.',
   190.00, null, 500, 'PK-CBG-008', 5,
   '{"Material":"Poly mailer","Min order":"100","Sizes":"S / M / L"}'::jsonb,
   'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=900&q=80',
   '{"https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=900&q=80"}'::text[], true, 59),
  ('73000000-0000-0000-0000-000000000009', 'Zip Bags (500)', 'zip-bags',
   '71000000-0000-0000-0000-000000000002', 'physical',
   'Clear resealable bags for jewellery, accessories and small items.',
   240.00, null, 400, 'PK-ZBG-009', 5,
   '{"Material":"LDPE","Min order":"500","Sizes":"5 x 8 cm - 15 x 22 cm"}'::jsonb,
   'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?auto=format&fit=crop&w=900&q=80',
   '{"https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?auto=format&fit=crop&w=900&q=80"}'::text[], true, 33),
  ('73000000-0000-0000-0000-000000000010', 'Tissue Paper (250 sheets)', 'tissue-paper',
   '71000000-0000-0000-0000-000000000002', 'physical',
   'Silk-touch tissue in brand colours to wrap and pad each piece.',
   150.00, null, 600, 'PK-TSP-010', 5,
   '{"Material":"Silk tissue","Sheets":"250","Sizes":"50 x 70 cm"}'::jsonb,
   'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=900&q=80',
   '{"https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=900&q=80"}'::text[], true, 47),
  ('73000000-0000-0000-0000-000000000011', 'Thank You Cards (200)', 'thank-you-cards',
   '71000000-0000-0000-0000-000000000002', 'physical',
   'Leave a handwritten-feel thank-you card in every parcel.',
   280.00, null, 250, 'PK-TYC-011', 7,
   '{"Material":"350gsm card","Finish":"Soft touch","Min order":"200"}'::jsonb,
   'https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&w=900&q=80',
   '{"https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&w=900&q=80"}'::text[], true, 38),
  ('73000000-0000-0000-0000-000000000012', 'Packaging Stickers (500)', 'packaging-stickers',
   '71000000-0000-0000-0000-000000000002', 'physical',
   'Seal your bags and boxes with logo stickers that double as branding.',
   220.00, null, 350, 'PK-PST-012', 7,
   '{"Material":"Vinyl","Min order":"500","Sizes":"50 x 50 mm"}'::jsonb,
   'https://images.unsplash.com/photo-1563281577-a7be47e20db9?auto=format&fit=crop&w=900&q=80',
   '{"https://images.unsplash.com/photo-1563281577-a7be47e20db9?auto=format&fit=crop&w=900&q=80"}'::text[], true, 29),
-- Equipment
  ('73000000-0000-0000-0000-000000000013', 'Tagging Gun', 'tagging-gun',
   '71000000-0000-0000-0000-000000000003', 'physical',
   'Heavy-duty tagging gun with spare needles. Fastens hang tags in seconds.',
   320.00, null, 80, 'EQ-TGN-013', 5,
   '{"Type":"Standard","Needles":"Spare included","Colour":"Black"}'::jsonb,
   'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=900&q=80',
   '{"https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=900&q=80"}'::text[], true, 72),
  ('73000000-0000-0000-0000-000000000014', 'Tagging Pins (2000)', 'tagging-pins',
   '71000000-0000-0000-0000-000000000003', 'physical',
   'Replacement plastic pins compatible with standard tagging guns.',
   140.00, null, 500, 'EQ-TGP-014', 5,
   '{"Count":"2000","Length":"40 mm","Colour":"White"}'::jsonb,
   'https://images.unsplash.com/photo-1579632652768-6cb9dcf85912?auto=format&fit=crop&w=900&q=80',
   '{"https://images.unsplash.com/photo-1579632652768-6cb9dcf85912?auto=format&fit=crop&w=900&q=80"}'::text[], true, 44),
  ('73000000-0000-0000-0000-000000000015', 'Measuring Tape (pack of 5)', 'measuring-tape',
   '71000000-0000-0000-0000-000000000003', 'physical',
   'Soft-body measuring tapes for sizing and quality checks.',
   120.00, null, 400, 'EQ-MTP-015', 5,
   '{"Pack":"5","Length":"150 cm","Side":"Dual"}'::jsonb,
   'https://images.unsplash.com/photo-1585967841459-aebcf5e0b161?auto=format&fit=crop&w=900&q=80',
   '{"https://images.unsplash.com/photo-1585967841459-aebcf5e0b161?auto=format&fit=crop&w=900&q=80"}'::text[], true, 26),
  ('73000000-0000-0000-0000-000000000016', 'Fabric Scissors (10 inch)', 'fabric-scissors',
   '71000000-0000-0000-0000-000000000003', 'physical',
   'Precision fabric shears with a smooth, clean cut through multiple layers.',
   260.00, null, 150, 'EQ-FSC-016', 5,
   '{"Blade":"10 inch","Handle":"Ergonomic","Material":"Stainless steel"}'::jsonb,
   'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80',
   '{"https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80"}'::text[], true, 31),
-- Printing
  ('73000000-0000-0000-0000-000000000017', 'QR Code Stickers (500)', 'qr-code-stickers',
   '71000000-0000-0000-0000-000000000004', 'physical',
   'Durable QR stickers linking to your store, socials or lookbook.',
   240.00, null, 300, 'PR-QRS-017', 7,
   '{"Material":"Vinyl","Min order":"500","Size":"30 x 30 mm"}'::jsonb,
   'https://images.unsplash.com/photo-1596627116790-af6f46dddbd8?auto=format&fit=crop&w=900&q=80',
   '{"https://images.unsplash.com/photo-1596627116790-af6f46dddbd8?auto=format&fit=crop&w=900&q=80"}'::text[], true, 22),
  ('73000000-0000-0000-0000-000000000018', 'Barcode Stickers (1000)', 'barcode-stickers',
   '71000000-0000-0000-0000-000000000004', 'physical',
   'Scannable barcode labels for inventory and order tracking.',
   260.00, null, 300, 'PR-BCS-018', 7,
   '{"Material":"Thermal","Min order":"1000","Size":"50 x 25 mm"}'::jsonb,
   'https://images.unsplash.com/photo-1587033411391-5d9e51cce126?auto=format&fit=crop&w=900&q=80',
   '{"https://images.unsplash.com/photo-1587033411391-5d9e51cce126?auto=format&fit=crop&w=900&q=80"}'::text[], true, 18),
  ('73000000-0000-0000-0000-000000000019', 'Logo Stickers (500)', 'logo-stickers',
   '71000000-0000-0000-0000-000000000004', 'physical',
   'Weatherproof vinyl stickers of your logo — for products, packaging and promo packs.',
   300.00, 260.00, 280, 'PR-LGS-019', 7,
   '{"Material":"Vinyl","Finish":"Gloss","Min order":"500","Sizes":"50 - 100 mm"}'::jsonb,
   'https://images.unsplash.com/photo-1611558709799-5b6e5ab7b8d9?auto=format&fit=crop&w=900&q=80',
   '{"https://images.unsplash.com/photo-1611558709799-5b6e5ab7b8d9?auto=format&fit=crop&w=900&q=80"}'::text[], true, 64),
  ('73000000-0000-0000-0000-000000000020', 'Clothing Stickers (500)', 'clothing-stickers',
   '71000000-0000-0000-0000-000000000004', 'physical',
   'Vibrant garment stickers for tags, swing cards and promotional mailers.',
   250.00, null, 320, 'PR-CLS-020', 7,
   '{"Material":"Vinyl","Min order":"500","Sizes":"40 - 80 mm"}'::jsonb,
   'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80',
   '{"https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80"}'::text[], true, 20),
-- Business Resources (digital)
  ('73000000-0000-0000-0000-000000000021', 'Canva Brand Template Pack', 'canva-brand-template-pack',
   '71000000-0000-0000-0000-000000000005', 'digital',
   'A full set of editable Canva templates — social posts, story covers, lookbooks and store banners. Instant download after purchase.',
   199.00, null, null, 'RS-CAN-021', null,
   '{"Format":"Canva link","Includes":"40+ templates","Delivery":"Instant download"}'::jsonb,
   'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=900&q=80',
   '{"https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=900&q=80"}'::text[], true, 150),
  ('73000000-0000-0000-0000-000000000022', 'Product Mockups (30+ scenes)', 'product-mockups',
   '71000000-0000-0000-0000-000000000005', 'digital',
   '30+ high-res apparel mockups (t-shirts, hoodies, caps) in studio and lifestyle scenes. Instant download after purchase.',
   249.00, 199.00, null, 'RS-MCK-022', null,
   '{"Format":"PNG / PSD","Scenes":"30+","Delivery":"Instant download"}'::jsonb,
   'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=80',
   '{"https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=80"}'::text[], true, 210),
  ('73000000-0000-0000-0000-000000000023', 'Product Photography Guide', 'product-photography-guide',
   '71000000-0000-0000-0000-000000000005', 'digital',
   'A practical guide to shooting clean, consistent product photos with any camera or phone. Instant download after purchase.',
   99.00, null, null, 'RS-PHG-023', null,
   '{"Format":"PDF","Pages":"48","Delivery":"Instant download"}'::jsonb,
   'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=900&q=80',
   '{"https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=900&q=80"}'::text[], true, 95),
  ('73000000-0000-0000-0000-000000000024', 'Brand Identity Workbook', 'brand-identity-workbook',
   '71000000-0000-0000-0000-000000000005', 'digital',
   'A guided workbook to define your brand name, story, voice and visual direction. Instant download after purchase.',
   149.00, null, null, 'RS-BIW-024', null,
   '{"Format":"PDF","Pages":"60","Delivery":"Instant download"}'::jsonb,
   'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80',
   '{"https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80"}'::text[], true, 80)
on conflict (slug) do nothing;

-- ============================================================
-- Storage: admin-managed supply product images
-- ============================================================
insert into storage.buckets (id, name, public)
values ('supply-images', 'supply-images', true)
on conflict (id) do nothing;

create policy "supply_images_public_read"
  on storage.objects for select
  using (bucket_id = 'supply-images');

create policy "supply_images_admin_write"
  on storage.objects for insert
  with check (
    bucket_id = 'supply-images'
    and public.is_admin()
    and (storage.foldername(name))[1] = 'supplies'
  );

create policy "supply_images_admin_update"
  on storage.objects for update
  using (bucket_id = 'supply-images' and public.is_admin());

create policy "supply_images_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'supply-images' and public.is_admin());

commit;
