-- Seller status lifecycle:
--  - Validate status values and enforce the transition matrix
--  - pending   -> approved | rejected
--  - approved  -> suspended
--  - suspended -> approved (reinstate)
--  - rejected  -> pending  (re-apply)
--  - Clear the stored reason when a seller is approved/reinstated
--  - Send a distinct notification when a suspended seller is reinstated
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
  v_seller     public.sellers%rowtype;
  v_prev_status text;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  if p_status not in ('pending', 'approved', 'rejected', 'suspended') then
    raise exception 'invalid status: %', p_status;
  end if;

  select application_status into v_prev_status from public.sellers where id = p_seller_id;
  if v_prev_status is null then
    raise exception 'seller not found';
  end if;

  if p_status = v_prev_status then
    raise exception 'seller is already %', p_status;
  end if;

  if (v_prev_status = 'pending'   and p_status not in ('approved', 'rejected'))
  or (v_prev_status = 'approved'  and p_status <> 'suspended')
  or (v_prev_status = 'suspended' and p_status <> 'approved')
  or (v_prev_status = 'rejected'  and p_status <> 'pending') then
    raise exception 'cannot change seller status from % to %', v_prev_status, p_status;
  end if;

  update public.sellers
  set application_status = p_status,
      rejection_reason   = case
                             when p_status in ('rejected', 'suspended') then p_reason
                             when p_status = 'approved' then null
                             else rejection_reason
                           end,
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

  if p_status = 'approved' and v_prev_status = 'suspended' then
    perform public.notify_user(v_seller.user_id, 'seller_reinstated',
      'Your store has been reinstated',
      'Your store is live again — your products are visible on CAPPTURE.');
  elsif p_status = 'approved' then
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
