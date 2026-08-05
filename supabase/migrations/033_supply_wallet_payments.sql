-- ============================================================
-- CAPPTURE — Wallet payments for the Supplies store
-- ============================================================
-- Sellers can pay for supplies from their dashboard balance.
-- Supplies are sold by the platform, so no commission applies and
-- there is no self-purchase guard (supply products have no seller).
-- Reuses the wallet_transactions ledger (032): order_id is null for
-- supply orders (that column references public.orders), so the supply
-- order number is recorded in `reference` instead.

-- ---------- 1. supply_orders.payment_method now allows 'wallet' ----------
alter table public.supply_orders drop constraint if exists supply_orders_payment_method_check;
alter table public.supply_orders
  add constraint supply_orders_payment_method_check
  check (payment_method in ('online', 'eft', 'wallet'));

-- ---------- 2. place_supply_order: wallet support ----------
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
  v_total         numeric(12, 2);
  v_balance       numeric(12, 2);
  v_order_number  text;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  -- Lock the buyer's seller row for wallet payments to serialize
  -- concurrent purchases and prevent double-spending.
  if p_payment_method = 'wallet' then
    select id into v_seller_id
    from public.sellers
    where user_id = auth.uid() and application_status = 'approved'
    for update;
    if not found then
      raise exception 'wallet payments require an approved seller account';
    end if;
  else
    select id into v_seller_id from public.sellers where user_id = auth.uid() limit 1;
    if not found then
      raise exception 'seller account required';
    end if;
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'order has no items';
  end if;

  if p_payment_method not in ('online', 'eft', 'wallet') then
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

  v_total := v_subtotal + v_delivery_fee;

  -- Available balance check (same formula as seller_balance()).
  if p_payment_method = 'wallet' then
    with earnings as (
      select coalesce(sum(o.total), 0) as v
      from public.orders o
      where o.seller_id = v_seller_id and o.status = 'delivered'
    ),
    commissions_paid as (
      select coalesce(sum(c.amount), 0) as v
      from public.commissions c
      where c.seller_id = v_seller_id and c.status = 'paid'
    ),
    withdrawals_done as (
      select coalesce(sum(w.amount), 0) as v
      from public.withdrawal_requests w
      where w.seller_id = v_seller_id and w.status in ('approved', 'paid')
    ),
    wallet_spend as (
      select coalesce(sum(wt.amount), 0) as v
      from public.wallet_transactions wt
      where wt.seller_id = v_seller_id
    )
    select e.v - c.v - w.v + s.v into v_balance
    from earnings e, commissions_paid c, withdrawals_done w, wallet_spend s;

    if v_balance < v_total then
      raise exception 'insufficient wallet balance (available R%, total R%)', v_balance, v_total;
    end if;
  end if;

  insert into public.supply_orders (
    seller_id, payment_method, payment_status, subtotal, delivery_fee, total,
    courier, shipping_address, notes
  ) values (
    v_seller_id, p_payment_method,
    case when p_payment_method in ('online', 'wallet') then 'paid' else 'pending_confirmation' end,
    v_subtotal, v_delivery_fee, v_total,
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

  -- Debit the buyer's wallet (negative amount). order_id stays null
  -- (it references public.orders); the supply order number is the reference.
  if p_payment_method = 'wallet' then
    select order_number into v_order_number from public.supply_orders where id = v_order_id;
    insert into public.wallet_transactions (seller_id, type, amount, order_id, reference, description)
    values (v_seller_id, 'purchase', -v_total, null, v_order_number,
            'Supplies purchase paid from wallet balance');
  end if;

  return (select s from public.supply_orders s where s.id = v_order_id);
end;
$$;

revoke all on function public.place_supply_order(jsonb, jsonb, uuid, text, text) from public;
grant execute on function public.place_supply_order(jsonb, jsonb, uuid, text, text) to authenticated;

-- ---------- 3. Refund/cancel re-credits the buyer's wallet ----------
create or replace function public.refund_wallet_supply_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.payment_method = 'wallet'
     and new.payment_status = 'paid'
     and new.status in ('cancelled', 'refunded')
     and old.status not in ('cancelled', 'refunded')
     and not exists (
       select 1 from public.wallet_transactions wt
       where wt.reference = new.order_number and wt.type = 'refund'
     )
  then
    insert into public.wallet_transactions (seller_id, type, amount, order_id, reference, description)
    values (new.seller_id, 'refund', new.total, null, new.order_number,
            'Refund for supplies order ' || new.order_number);
  end if;
  return new;
end;
$$;

drop trigger if exists supply_orders_refund_wallet on public.supply_orders;
create trigger supply_orders_refund_wallet
  after update of status on public.supply_orders
  for each row execute procedure public.refund_wallet_supply_order();
