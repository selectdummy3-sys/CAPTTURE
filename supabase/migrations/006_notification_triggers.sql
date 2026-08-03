-- ============================================================
-- CAPPTURE — Operational notification triggers
-- ============================================================

begin;

-- Notify every admin when a seller applies.
create or replace function public.notify_admins_seller_applied()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin record;
begin
  for v_admin in select id from public.profiles where role = 'admin'
  loop
    perform public.notify_user(
      v_admin.id, 'seller_application',
      'New seller application',
      new.business_name || ' (' || new.store_username || ') has applied to join the marketplace.',
      jsonb_build_object('seller_id', new.id, 'business_name', new.business_name)
    );
  end loop;
  return new;
end;
$$;

create trigger sellers_notify_admins
  after insert on public.sellers
  for each row execute procedure public.notify_admins_seller_applied();

-- Notify a seller when a new order lands in their store.
create or replace function public.notify_seller_new_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  select user_id into v_user_id from public.sellers where id = new.seller_id;
  if v_user_id is not null then
    perform public.notify_user(
      v_user_id, 'new_order',
      'New order received',
      'Order ' || new.order_number || ' for R ' || to_char(new.total, 'FM999G999G990D00') || ' is waiting.',
      jsonb_build_object('order_id', new.id, 'order_number', new.order_number)
    );
  end if;
  return new;
end;
$$;

create trigger orders_notify_seller
  after insert on public.orders
  for each row execute procedure public.notify_seller_new_order();

-- Notify a seller when their product receives a review.
create or replace function public.notify_seller_new_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_product_name text;
begin
  select s.user_id, p.name into v_user_id, v_product_name
  from public.products p
  join public.sellers s on s.id = p.seller_id
  where p.id = new.product_id;

  if v_user_id is not null then
    perform public.notify_user(
      v_user_id, 'new_review',
      'New product review',
      v_product_name || ' received a ' || new.rating || '-star review.',
      jsonb_build_object('product_id', new.product_id, 'review_id', new.id)
    );
  end if;
  return new;
end;
$$;

create trigger reviews_notify_seller
  after insert on public.product_reviews
  for each row execute procedure public.notify_seller_new_review();

commit;
