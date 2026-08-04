-- ============================================================
-- CAPPTURE — Product moderation
-- ============================================================
--  - Sellers can no longer publish directly; a seller's "published"
--    submission enters a "pending" review queue instead.
--  - Admins approve (pending -> published) or reject (pending -> rejected
--    with a reason) products via set_product_status().
--  - The rejection reason is stored in products.moderation_reason so the
--    seller sees exactly why a product was declined.

begin;

-- 1) Expand the allowed product statuses and store a moderation reason.
alter table public.products
  drop constraint if exists products_status_check;

alter table public.products
  add constraint products_status_check
  check (status in ('draft', 'pending', 'published', 'rejected', 'archived'));

alter table public.products
  add column if not exists moderation_reason text;

-- 2) Route seller "publish" attempts through the review queue.
--    Admins bypass the queue. Editing an already-live product keeps it live.
create or replace function public.moderate_product_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.status = 'published'
       and (TG_OP = 'INSERT' or old.status is distinct from 'published') then
      new.status := 'pending';
      new.moderation_reason := null;
    end if;
  elsif new.status = 'published' then
    new.moderation_reason := null;
  end if;
  return new;
end;
$$;

drop trigger if exists products_moderate_status on public.products;
create trigger products_moderate_status
  before insert or update on public.products
  for each row execute procedure public.moderate_product_status();

-- 3) Notify every admin when a product enters the review queue.
create or replace function public.notify_admins_product_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin record;
begin
  if new.status = 'pending' and not public.is_admin() then
    if TG_OP = 'INSERT' or old.status is distinct from 'pending' then
      for v_admin in select id from public.profiles where role = 'admin'
      loop
        perform public.notify_user(
          v_admin.id, 'product_review',
          'New product awaiting review',
          '"' || new.name || '" has been submitted for review.',
          jsonb_build_object('product_id', new.id, 'product_name', new.name)
        );
      end loop;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists products_notify_admins_review on public.products;
create trigger products_notify_admins_review
  after insert or update on public.products
  for each row execute procedure public.notify_admins_product_review();

-- 4) Admin moderation RPC.
create or replace function public.set_product_status(
  p_product_id  uuid,
  p_status      text,
  p_reason      text default null
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product    public.products%rowtype;
  v_prev_status text;
  v_user_id     uuid;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  if p_status not in ('draft', 'pending', 'published', 'rejected', 'archived') then
    raise exception 'invalid status: %', p_status;
  end if;

  select status into v_prev_status from public.products where id = p_product_id;
  if v_prev_status is null then
    raise exception 'product not found';
  end if;

  if p_status = v_prev_status then
    raise exception 'product is already %', p_status;
  end if;

  if p_status = 'rejected' and (p_reason is null or length(trim(p_reason)) = 0) then
    raise exception 'a rejection reason is required';
  end if;

  update public.products
  set status = p_status,
      moderation_reason = case
                            when p_status = 'rejected' then trim(p_reason)
                            when p_status in ('published', 'pending') then null
                            else moderation_reason
                          end,
      updated_at = now()
  where id = p_product_id
  returning * into v_product;

  select user_id into v_user_id from public.sellers where id = v_product.seller_id;

  if p_status = 'published' then
    perform public.notify_user(v_user_id, 'product_approved',
      'Your product is live',
      '"' || v_product.name || '" has been approved and is now visible on CAPPTURE.',
      jsonb_build_object('product_id', v_product.id, 'product_name', v_product.name));
  elsif p_status = 'rejected' then
    perform public.notify_user(v_user_id, 'product_rejected',
      'Your product was not approved',
      '"' || v_product.name || '" was rejected: ' || coalesce(p_reason, ''),
      jsonb_build_object('product_id', v_product.id, 'product_name', v_product.name));
  end if;

  return v_product;
end;
$$;

revoke all on function public.set_product_status(uuid, text, text) from public;
grant execute on function public.set_product_status(uuid, text, text) to authenticated;

-- Trigger-only helpers must not be callable via RPC.
revoke execute on function public.moderate_product_status() from anon, authenticated, public;
revoke execute on function public.notify_admins_product_review() from anon, authenticated, public;

commit;
