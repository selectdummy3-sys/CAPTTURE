-- 029_also_bought.sql
-- Real "what others also bought" recommendations based on co-purchase data.

begin;

create or replace function public.get_also_bought(
  p_product_id uuid,
  p_limit int default 8
)
returns table(product_id uuid, bought_together int)
language sql
security definer
set search_path = public
as $$
  with orders_with_product as (
    select distinct order_id
    from public.order_items
    where product_id = p_product_id
  ),
  co_occurrences as (
    select oi.product_id, count(*) as cnt
    from public.order_items oi
    join orders_with_product owp on owp.order_id = oi.order_id
    where oi.product_id is not null
      and oi.product_id <> p_product_id
    group by oi.product_id
  )
  select co.product_id, co.cnt as bought_together
  from co_occurrences co
  join public.products p on p.id = co.product_id
    and p.status = 'published'
  join public.sellers s on s.id = p.seller_id
    and s.application_status = 'approved'
  order by co.cnt desc
  limit p_limit;
$$;

grant execute on function public.get_also_bought(uuid, int) to anon, authenticated;

commit;
