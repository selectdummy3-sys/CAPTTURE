-- Public order tracking lookup.
-- Validates the caller by matching the order number against the owning
-- account's email address, then returns a safe, limited projection of the
-- order (no customer identity fields, no internal notes, no seller data).

create or replace function public.lookup_order(
  p_order_number text,
  p_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order jsonb;
begin
  if p_order_number is null or trim(p_order_number) = '' then
    raise exception 'Order number is required';
  end if;
  if p_email is null or trim(p_email) = '' then
    raise exception 'Email is required';
  end if;

  select jsonb_build_object(
    'order_number', o.order_number,
    'status', o.status,
    'payment_status', o.payment_status,
    'payment_method', o.payment_method,
    'created_at', o.created_at,
    'updated_at', o.updated_at,
    'delivery_method', o.delivery_method,
    'pep_delivery_tier', o.pep_delivery_tier,
    'shipping_address', o.shipping_address,
    'tracking_number', o.tracking_number,
    'subtotal', o.subtotal,
    'discount', o.discount,
    'shipping', o.shipping,
    'total', o.total,
    'pep_store', case when o.pep_store_id is null then null else (
      select jsonb_build_object(
        'store_name', s.store_name,
        'store_code', s.store_code,
        'address_line', s.address_line,
        'city', s.city,
        'province', s.province
      )
      from public.pep_stores s
      where s.id = o.pep_store_id
    ) end,
    'items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'product_name', i.product_name,
            'size', i.size,
            'colour', i.colour,
            'quantity', i.quantity,
            'price', i.price,
            'line_total', i.line_total,
            'product_image', i.product_image
          )
        )
        from public.order_items i
        where i.order_id = o.id
      ),
      '[]'::jsonb
    )
  )
  into v_order
  from public.orders o
  join public.profiles pr on pr.id = o.user_id
  where o.order_number = p_order_number
    and lower(pr.email) = lower(p_email)
  limit 1;

  if v_order is null then
    raise exception 'no_match';
  end if;

  return v_order;
end;
$$;

revoke all on function public.lookup_order(text, text) from public;
grant execute on function public.lookup_order(text, text) to anon, authenticated;

comment on function public.lookup_order(text, text) is
  'Public order tracking lookup that validates the order number against the account email.';