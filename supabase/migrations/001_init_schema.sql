-- ============================================================
-- CAPPTURE — Initial schema
-- Multi-vendor South African fashion marketplace
-- ============================================================

begin;

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ---------- Helpers ----------

-- Keeps updated_at fresh on any table that calls it.
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Creates a public profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- profiles ----------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null default '',
  full_name     text not null default '',
  avatar_url    text,
  phone         text,
  role          text not null default 'customer'
                check (role in ('customer', 'seller', 'admin')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- ---------- sellers ----------
create table public.sellers (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references public.profiles (id) on delete cascade,
  business_name       text not null,
  store_username      text not null unique
                      check (store_username ~ '^[a-z0-9_]{3,24}$'),
  description         text,
  province            text not null default '',
  phone               text,
  email               text,
  logo_url            text,
  banner_url          text,
  id_document_url     text,
  social_links        jsonb not null default '{}'::jsonb,
  bank_details        jsonb not null default '{}'::jsonb,
  application_status  text not null default 'pending'
                      check (application_status in ('pending', 'approved', 'rejected', 'suspended')),
  rejection_reason    text,
  featured            boolean not null default false,
  commission_rate     numeric(5, 4),
  approved_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index sellers_status_idx on public.sellers (application_status);
create index sellers_username_idx on public.sellers using gin (store_username gin_trgm_ops);
create index sellers_business_name_idx on public.sellers using gin (business_name gin_trgm_ops);

create trigger sellers_updated_at
  before update on public.sellers
  for each row execute procedure public.handle_updated_at();

-- ---------- categories ----------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  parent_id   uuid references public.categories (id) on delete set null,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index categories_parent_idx on public.categories (parent_id);

create trigger categories_updated_at
  before update on public.categories
  for each row execute procedure public.handle_updated_at();

-- ---------- products ----------
create table public.products (
  id                  uuid primary key default gen_random_uuid(),
  seller_id           uuid not null references public.sellers (id) on delete cascade,
  category_id         uuid references public.categories (id) on delete set null,
  name                text not null,
  slug                text not null,
  description         text,
  price               numeric(12, 2) not null check (price >= 0),
  sale_price          numeric(12, 2) check (sale_price >= 0),
  stock               integer not null default 0 check (stock >= 0),
  sku                 text,
  weight              numeric(8, 2),
  material            text,
  gender              text not null default 'unisex'
                      check (gender in ('men', 'women', 'unisex', 'kids')),
  sizes               text[] not null default '{}',
  colours             text[] not null default '{}',
  tags                text[] not null default '{}',
  featured_image      text,
  status              text not null default 'draft'
                      check (status in ('draft', 'published', 'archived')),
  is_flash_sale       boolean not null default false,
  flash_sale_ends_at  timestamptz,
  view_count          integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (seller_id, slug)
);

create index products_status_idx on public.products (status);
create index products_category_idx on public.products (category_id);
create index products_created_at_idx on public.products (created_at desc);
create index products_flash_sale_idx on public.products (is_flash_sale)
  where is_flash_sale;
create index products_name_idx on public.products using gin (name gin_trgm_ops);
create index products_tags_idx on public.products using gin (tags);
create index products_gender_idx on public.products (gender);

create trigger products_updated_at
  before update on public.products
  for each row execute procedure public.handle_updated_at();

-- ---------- product_images ----------
create table public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  url         text not null,
  alt         text not null default '',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index product_images_product_idx on public.product_images (product_id, sort_order);

-- ---------- store_followers ----------
create table public.store_followers (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references public.sellers (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (seller_id, user_id)
);

create index store_followers_seller_idx on public.store_followers (seller_id);

-- ---------- wishlist_items ----------
create table public.wishlist_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, product_id)
);

create index wishlist_items_user_idx on public.wishlist_items (user_id);

-- ---------- recently_viewed ----------
create table public.recently_viewed (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  viewed_at   timestamptz not null default now(),
  unique (user_id, product_id)
);

create index recently_viewed_user_idx on public.recently_viewed (user_id, viewed_at desc);

-- ---------- carts ----------
create table public.carts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger carts_updated_at
  before update on public.carts
  for each row execute procedure public.handle_updated_at();

-- ---------- cart_items ----------
create table public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  cart_id     uuid not null references public.carts (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  quantity    integer not null default 1 check (quantity > 0),
  size        text,
  colour      text,
  price       numeric(12, 2) not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (cart_id, product_id, size, colour)
);

create index cart_items_cart_idx on public.cart_items (cart_id);

create trigger cart_items_updated_at
  before update on public.cart_items
  for each row execute procedure public.handle_updated_at();

-- ---------- coupons ----------
create table public.coupons (
  id                 uuid primary key default gen_random_uuid(),
  seller_id          uuid references public.sellers (id) on delete cascade,
  code               text not null unique,
  description        text,
  discount_type      text not null check (discount_type in ('percentage', 'fixed')),
  discount_value     numeric(12, 2) not null check (discount_value >= 0),
  min_order_amount   numeric(12, 2) not null default 0,
  usage_limit        integer,
  used_count         integer not null default 0,
  is_active          boolean not null default true,
  starts_at          timestamptz,
  ends_at            timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index coupons_code_idx on public.coupons (code);

create trigger coupons_updated_at
  before update on public.coupons
  for each row execute procedure public.handle_updated_at();

-- ---------- orders ----------
create sequence public.order_number_seq start 1000;

create or replace function public.generate_order_number()
returns text
language sql
stable
as $$
  select 'CP-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 6, '0');
$$;

create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  order_number        text not null unique default public.generate_order_number(),
  user_id             uuid references public.profiles (id) on delete set null,
  seller_id           uuid not null references public.sellers (id),
  status              text not null default 'pending'
                      check (status in ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_method      text check (payment_method in ('cod', 'eft')),
  payment_status      text not null default 'unpaid'
                      check (payment_status in ('unpaid', 'pending_confirmation', 'paid')),
  subtotal            numeric(12, 2) not null default 0,
  discount            numeric(12, 2) not null default 0,
  coupon_id           uuid references public.coupons (id) on delete set null,
  shipping            numeric(12, 2) not null default 0,
  total               numeric(12, 2) not null default 0,
  shipping_address    jsonb not null default '{}'::jsonb,
  billing_address     jsonb,
  notes               text,
  delivered_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_seller_idx on public.orders (seller_id, created_at desc);
create index orders_status_idx on public.orders (status);

create trigger orders_updated_at
  before update on public.orders
  for each row execute procedure public.handle_updated_at();

-- ---------- order_items ----------
create table public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders (id) on delete cascade,
  product_id     uuid references public.products (id) on delete set null,
  seller_id      uuid not null,
  product_name   text not null,
  product_image  text,
  price          numeric(12, 2) not null,
  quantity       integer not null check (quantity > 0),
  size           text,
  colour         text,
  line_total     numeric(12, 2) not null
);

create index order_items_order_idx on public.order_items (order_id);

-- ---------- product_reviews ----------
create table public.product_reviews (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references public.products (id) on delete cascade,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  order_id         uuid references public.orders (id) on delete set null,
  rating           integer not null check (rating between 1 and 5),
  title            text,
  body             text,
  status           text not null default 'approved'
                   check (status in ('pending', 'approved', 'rejected')),
  helpful_votes    integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (product_id, user_id)
);

create index product_reviews_product_idx on public.product_reviews (product_id, created_at desc);

create trigger product_reviews_updated_at
  before update on public.product_reviews
  for each row execute procedure public.handle_updated_at();

-- ---------- notifications ----------
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  type        text not null,
  title       text not null,
  body        text,
  data        jsonb not null default '{}'::jsonb,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- ---------- platform_settings ----------
create table public.platform_settings (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

create trigger platform_settings_updated_at
  before update on public.platform_settings
  for each row execute procedure public.handle_updated_at();

-- ---------- commissions ----------
create table public.commissions (
  id            uuid primary key default gen_random_uuid(),
  seller_id     uuid not null references public.sellers (id) on delete cascade,
  order_id      uuid not null references public.orders (id) on delete cascade,
  order_number  text,
  rate          numeric(5, 4) not null,
  amount        numeric(12, 2) not null,
  status        text not null default 'pending' check (status in ('pending', 'paid')),
  paid_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index commissions_seller_idx on public.commissions (seller_id, status);

commit;
