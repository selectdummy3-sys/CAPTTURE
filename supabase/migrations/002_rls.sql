-- ============================================================
-- CAPPTURE — Row Level Security
-- ============================================================

begin;

-- ---------- Helper predicates ----------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.current_seller()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.sellers
  where user_id = auth.uid() and application_status = 'approved'
  limit 1;
$$;

-- ---------- profiles ----------
alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_select_admin"
  on public.profiles for select
  using (public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = 'customer');

create policy "profiles_update_admin"
  on public.profiles for update
  using (public.is_admin());

-- ---------- user_public view (safe read-only exposure) ----------
create view public.user_public with (security_invoker = true) as
  select id, full_name, avatar_url
  from public.profiles;

-- ---------- sellers ----------
alter table public.sellers enable row level security;

create policy "sellers_select_approved"
  on public.sellers for select
  using (application_status = 'approved');

create policy "sellers_select_own"
  on public.sellers for select
  using (user_id = auth.uid());

create policy "sellers_select_admin"
  on public.sellers for select
  using (public.is_admin());

create policy "sellers_insert_own"
  on public.sellers for insert
  with check (user_id = auth.uid() and application_status = 'pending');

create policy "sellers_update_own_pending"
  on public.sellers for update
  using (user_id = auth.uid() and application_status = 'pending')
  with check (user_id = auth.uid() and application_status = 'pending');

create policy "sellers_update_admin"
  on public.sellers for update
  using (public.is_admin());

create policy "sellers_delete_admin"
  on public.sellers for delete
  using (public.is_admin());

-- ---------- categories ----------
alter table public.categories enable row level security;

create policy "categories_select_public"
  on public.categories for select
  using (is_active = true);

create policy "categories_select_admin"
  on public.categories for select
  using (public.is_admin());

create policy "categories_write_admin"
  on public.categories for all
  using (public.is_admin());

-- ---------- products ----------
alter table public.products enable row level security;

create policy "products_select_public"
  on public.products for select
  using (status = 'published');

create policy "products_select_owner"
  on public.products for select
  using (
    public.current_seller() is not null
    and seller_id = public.current_seller()
  );

create policy "products_select_admin"
  on public.products for select
  using (public.is_admin());

create policy "products_insert_owner"
  on public.products for insert
  with check (
    public.current_seller() is not null
    and seller_id = public.current_seller()
  );

create policy "products_update_owner"
  on public.products for update
  using (
    public.current_seller() is not null
    and seller_id = public.current_seller()
  );

create policy "products_delete_owner"
  on public.products for delete
  using (
    public.current_seller() is not null
    and seller_id = public.current_seller()
  );

create policy "products_write_admin"
  on public.products for all
  using (public.is_admin());

-- ---------- product_images ----------
alter table public.product_images enable row level security;

create policy "product_images_select_public"
  on public.product_images for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.status = 'published'
    )
  );

create policy "product_images_select_owner"
  on public.product_images for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id
        and p.seller_id = public.current_seller()
    )
  );

create policy "product_images_select_admin"
  on public.product_images for select
  using (public.is_admin());

create policy "product_images_write_owner"
  on public.product_images for all
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id
        and p.seller_id = public.current_seller()
    )
  );

create policy "product_images_write_admin"
  on public.product_images for all
  using (public.is_admin());

-- ---------- store_followers ----------
alter table public.store_followers enable row level security;

create policy "store_followers_select_public"
  on public.store_followers for select
  using (true);

create policy "store_followers_insert_own"
  on public.store_followers for insert
  with check (user_id = auth.uid());

create policy "store_followers_delete_own"
  on public.store_followers for delete
  using (user_id = auth.uid());

-- ---------- wishlist_items ----------
alter table public.wishlist_items enable row level security;

create policy "wishlist_items_own"
  on public.wishlist_items for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------- recently_viewed ----------
alter table public.recently_viewed enable row level security;

create policy "recently_viewed_own"
  on public.recently_viewed for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------- carts ----------
alter table public.carts enable row level security;

create policy "carts_own"
  on public.carts for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------- cart_items ----------
alter table public.cart_items enable row level security;

create policy "cart_items_own"
  on public.cart_items for all
  using (
    exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id and c.user_id = auth.uid()
    )
  );

-- ---------- coupons ----------
alter table public.coupons enable row level security;

create policy "coupons_select_public"
  on public.coupons for select
  using (true);

create policy "coupons_write_owner"
  on public.coupons for all
  using (
    public.current_seller() is not null
    and seller_id = public.current_seller()
  );

create policy "coupons_write_admin"
  on public.coupons for all
  using (public.is_admin());

-- ---------- orders ----------
alter table public.orders enable row level security;

create policy "orders_select_buyer"
  on public.orders for select
  using (user_id = auth.uid());

create policy "orders_select_seller"
  on public.orders for select
  using (
    public.current_seller() is not null
    and seller_id = public.current_seller()
  );

create policy "orders_select_admin"
  on public.orders for select
  using (public.is_admin());

create policy "orders_insert_buyer"
  on public.orders for insert
  with check (user_id = auth.uid());

create policy "orders_update_seller"
  on public.orders for update
  using (
    public.current_seller() is not null
    and seller_id = public.current_seller()
  );

create policy "orders_update_admin"
  on public.orders for update
  using (public.is_admin());

-- ---------- order_items ----------
alter table public.order_items enable row level security;

create policy "order_items_select_buyer"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

create policy "order_items_select_seller"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.seller_id = public.current_seller()
    )
  );

create policy "order_items_select_admin"
  on public.order_items for select
  using (public.is_admin());

-- ---------- product_reviews ----------
alter table public.product_reviews enable row level security;

create policy "product_reviews_select_public"
  on public.product_reviews for select
  using (status = 'approved');

create policy "product_reviews_select_admin"
  on public.product_reviews for select
  using (public.is_admin());

create policy "product_reviews_insert_own"
  on public.product_reviews for insert
  with check (
    user_id = auth.uid()
    and status = 'approved'
  );

create policy "product_reviews_update_own"
  on public.product_reviews for update
  using (user_id = auth.uid());

create policy "product_reviews_delete_own"
  on public.product_reviews for delete
  using (user_id = auth.uid());

create policy "product_reviews_write_admin"
  on public.product_reviews for all
  using (public.is_admin());

-- ---------- notifications ----------
alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "notifications_update_own"
  on public.notifications for update
  using (user_id = auth.uid());

create policy "notifications_insert_own"
  on public.notifications for insert
  with check (user_id = auth.uid());

-- ---------- platform_settings ----------
alter table public.platform_settings enable row level security;

create policy "platform_settings_select_public"
  on public.platform_settings for select
  using (true);

create policy "platform_settings_write_admin"
  on public.platform_settings for all
  using (public.is_admin());

-- ---------- commissions ----------
alter table public.commissions enable row level security;

create policy "commissions_select_seller"
  on public.commissions for select
  using (
    public.current_seller() is not null
    and seller_id = public.current_seller()
  );

create policy "commissions_select_admin"
  on public.commissions for select
  using (public.is_admin());

create policy "commissions_update_admin"
  on public.commissions for update
  using (public.is_admin());

-- ============================================================
-- Transactional order placement (SECURITY DEFINER)
-- ============================================================

create or replace function public.place_order(
  p_seller_id       uuid,
  p_items           jsonb,
  p_payment_method  text,
  p_shipping_address jsonb,
  p_billing_address jsonb default null,
  p_notes           text default null,
  p_coupon_code     text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id        uuid := auth.uid();
  v_item           jsonb;
  v_product        public.products%rowtype;
  v_qty            integer;
  v_size           text;
  v_colour         text;
  v_unit_price     numeric(12, 2);
  v_subtotal       numeric(12, 2) := 0;
  v_discount       numeric(12, 2) := 0;
  v_coupon         public.coupons%rowtype;
  v_shipping       numeric(12, 2) := 0;
  v_total          numeric(12, 2) := 0;
  v_order_id       uuid;
  v_commission_rate numeric(5, 4);
  v_free_shipping_threshold numeric(12, 2) := 100000;
  v_shipping_base  numeric(12, 2) := 60;
  v_settings       jsonb;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'order has no items';
  end if;

  if p_payment_method not in ('cod', 'eft') then
    raise exception 'unsupported payment method';
  end if;

  -- Sellers must exist and be approved.
  perform 1 from public.sellers
  where id = p_seller_id and application_status = 'approved';
  if not found then
    raise exception 'seller is not active';
  end if;

  -- Loop items, lock product rows, validate stock, snapshot prices.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid
    for update;

    if not found then
      raise exception 'product not found';
    end if;
    if v_product.status <> 'published' then
      raise exception 'product "%" is not available', v_product.name;
    end if;

    v_qty    := coalesce((v_item ->> 'quantity')::integer, 0);
    v_size   := v_item ->> 'size';
    v_colour := v_item ->> 'colour';
    if v_qty < 1 then
      raise exception 'invalid quantity';
    end if;
    if v_product.stock < v_qty then
      raise exception 'only % left in stock for "%"', v_product.stock, v_product.name;
    end if;

    v_unit_price := coalesce(v_product.sale_price, v_product.price);
    v_subtotal   := v_subtotal + (v_unit_price * v_qty);
  end loop;

  -- Coupon validation (platform-wide or belonging to this seller).
  if p_coupon_code is not null and p_coupon_code <> '' then
    select * into v_coupon
    from public.coupons
    where upper(code) = upper(p_coupon_code)
      and (seller_id is null or seller_id = p_seller_id)
      and is_active = true
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at > now())
      and (usage_limit is null or used_count < usage_limit);
    if not found then
      raise exception 'coupon is not valid';
    end if;
    if v_coupon.min_order_amount > 0 and v_subtotal < v_coupon.min_order_amount then
      raise exception 'order subtotal below coupon minimum';
    end if;

    if v_coupon.discount_type = 'percentage' then
      v_discount := round(v_subtotal * (v_coupon.discount_value / 100), 2);
    else
      v_discount := least(v_coupon.discount_value, v_subtotal);
    end if;
  end if;

  -- Shipping rules from platform settings.
  select value into v_settings
  from public.platform_settings where key = 'shipping';
  if v_settings is not null then
    v_shipping_base := coalesce((v_settings ->> 'base_fee')::numeric, v_shipping_base);
    v_free_shipping_threshold := coalesce((v_settings ->> 'free_above')::numeric, v_free_shipping_threshold);
  end if;

  if (v_subtotal - v_discount) < v_free_shipping_threshold then
    v_shipping := v_shipping_base;
  end if;

  v_total := v_subtotal - v_discount + v_shipping;

  -- Persist order.
  insert into public.orders (
    user_id, seller_id, payment_method, payment_status,
    subtotal, discount, coupon_id, shipping, total,
    shipping_address, billing_address, notes
  ) values (
    v_user_id, p_seller_id, p_payment_method,
    case when p_payment_method = 'cod' then 'paid' else 'pending_confirmation' end,
    v_subtotal, v_discount,
    case when p_coupon_code is not null and p_coupon_code <> '' then v_coupon.id else null end,
    v_shipping, v_total,
    p_shipping_address, coalesce(p_billing_address, p_shipping_address), p_notes
  ) returning id into v_order_id;

  -- Items + stock.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product from public.products where id = (v_item ->> 'product_id')::uuid;
    v_qty := coalesce((v_item ->> 'quantity')::integer, 0);
    v_unit_price := coalesce(v_product.sale_price, v_product.price);

    insert into public.order_items (
      order_id, product_id, seller_id, product_name, product_image,
      price, quantity, size, colour, line_total
    ) values (
      v_order_id, v_product.id, p_seller_id, v_product.name, v_product.featured_image,
      v_unit_price, v_qty, v_item ->> 'size', v_item ->> 'colour',
      v_unit_price * v_qty
    );

    update public.products
    set stock = stock - v_qty
    where id = v_product.id;
  end loop;

  -- Coupon usage.
  if p_coupon_code is not null and p_coupon_code <> '' then
    update public.coupons set used_count = used_count + 1 where id = v_coupon.id;
  end if;

  -- Commission (pending until paid / delivered).
  select coalesce(s.commission_rate, (select (value ->> 'rate')::numeric(5,4) from public.platform_settings where key = 'commission')) 
    into v_commission_rate
  from public.sellers s where s.id = p_seller_id;
  v_commission_rate := coalesce(v_commission_rate, 0.08);

  insert into public.commissions (seller_id, order_id, order_number, rate, amount, status)
  values (p_seller_id, v_order_id, null, v_commission_rate, round(v_total * v_commission_rate, 2), 'pending');

  return (select * from public.orders where id = v_order_id);
end;
$$;

revoke all on function public.place_order(uuid, jsonb, text, jsonb, jsonb, text, text) from public;
grant execute on function public.place_order(uuid, jsonb, text, jsonb, jsonb, text, text) to authenticated;

-- ---------- Notification helper ----------
create or replace function public.notify_user(
  p_user_id uuid,
  p_type    text,
  p_title   text,
  p_body    text default null,
  p_data    jsonb default '{}'::jsonb
)
returns public.notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notif public.notifications;
begin
  insert into public.notifications (user_id, type, title, body, data)
  values (p_user_id, p_type, p_title, p_body, p_data)
  returning * into v_notif;
  return v_notif;
end;
$$;

revoke all on function public.notify_user(uuid, text, text, text, jsonb) from public;
grant execute on function public.notify_user(uuid, text, text, text, jsonb) to authenticated;

-- ---------- Seller approval helper (admin action) ----------
create or replace function public.set_seller_status(
  p_seller_id  uuid,
  p_status     text,
  p_reason     text default null
)
returns public.sellers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller public.sellers%rowtype;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  update public.sellers
  set application_status = p_status,
      rejection_reason   = case when p_status = 'rejected' then p_reason else rejection_reason end,
      approved_at        = case when p_status = 'approved' then now() else approved_at end,
      updated_at         = now()
  where id = p_seller_id
  returning * into v_seller;

  -- Gate dashboard access through the profile role.
  if p_status = 'approved' then
    update public.profiles set role = 'seller' where id = v_seller.user_id;
  elsif p_status in ('suspended', 'rejected') then
    update public.profiles set role = 'customer' where id = v_seller.user_id and role <> 'admin';
  end if;

  if p_status = 'approved' then
    perform public.notify_user(v_seller.user_id, 'seller_approved',
      'Your store has been approved',
      'Welcome to CAPPTURE — you can now manage your store and products.');
  elsif p_status = 'rejected' then
    perform public.notify_user(v_seller.user_id, 'seller_rejected',
      'Your store application was not approved',
      coalesce(p_reason, 'Please review your details and re-apply.'));
  elsif p_status = 'suspended' then
    perform public.notify_user(v_seller.user_id, 'seller_suspended',
      'Your store has been suspended',
      coalesce(p_reason, 'Contact support for more information.'));
  end if;

  return v_seller;
end;
$$;

revoke all on function public.set_seller_status(uuid, text, text) from public;
grant execute on function public.set_seller_status(uuid, text, text) to authenticated;

-- ---------- Stock decrement guard (prevents overselling outside RPC) ----------
create or replace function public.enforce_stock_floor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.stock < 0 then
    raise exception 'stock cannot go below zero';
  end if;
  return new;
end;
$$;

create trigger products_stock_floor
  before update on public.products
  for each row execute procedure public.enforce_stock_floor();

commit;
