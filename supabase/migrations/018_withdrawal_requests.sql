-- 018_withdrawal_requests.sql
-- Seller withdrawal requests system

-- 1. withdrawal_requests table
create table if not exists public.withdrawal_requests (
  id            uuid primary key default gen_random_uuid(),
  seller_id     uuid not null references public.sellers(id) on delete cascade,
  amount        numeric(12,2) not null check (amount > 0),
  status        text not null default 'pending'
                check (status in ('pending', 'approved', 'rejected', 'paid')),
  bank_snapshot jsonb not null default '{}'::jsonb,
  admin_notes   text,
  processed_at  timestamptz,
  created_at    timestamptz not null default now()
);

comment on table public.withdrawal_requests is 'Seller withdrawal/payout requests';

create index if not exists idx_wr_seller   on public.withdrawal_requests (seller_id);
create index if not exists idx_wr_status   on public.withdrawal_requests (status);
create index if not exists idx_wr_created  on public.withdrawal_requests (created_at desc);

-- 2. Enable RLS
alter table public.withdrawal_requests enable row level security;

-- Sellers can read their own requests
create policy "Sellers read own withdrawal requests"
  on public.withdrawal_requests for select
  using (
    exists (
      select 1 from public.sellers s
      where s.user_id = auth.uid()
        and s.id = withdrawal_requests.seller_id
    )
  );

-- Sellers can insert their own requests (only pending status enforced by check)
create policy "Sellers create withdrawal requests"
  on public.withdrawal_requests for insert
  with check (
    exists (
      select 1 from public.sellers s
      where s.user_id = auth.uid()
        and s.id = withdrawal_requests.seller_id
    )
    and status = 'pending'
  );

-- Admins can do everything
create policy "Admins manage withdrawal requests"
  on public.withdrawal_requests for all
  using (public.is_admin())
  with check (public.is_admin());

-- 3. RPC: get seller's available balance
create or replace function public.seller_balance()
returns numeric(12,2)
language sql
security definer
set search_path = public
stable
as $$
  with earnings as (
    select coalesce(sum(o.total), 0) as total_orders
    from public.orders o
    where o.seller_id = (select id from public.sellers where user_id = auth.uid())
      and o.status = 'delivered'
  ),
  commissions_paid as (
    select coalesce(sum(c.amount), 0) as total_commissions
    from public.commissions c
    where c.seller_id = (select id from public.sellers where user_id = auth.uid())
      and c.status = 'paid'
  ),
  withdrawals_done as (
    select coalesce(sum(w.amount), 0) as total_withdrawn
    from public.withdrawal_requests w
    where w.seller_id = (select id from public.sellers where user_id = auth.uid())
      and w.status in ('approved', 'paid')
  )
  select
    e.total_orders - c.total_commissions - w.total_withdrawn
  from earnings e, commissions_paid c, withdrawals_done w;
$$;

-- 4. RPC: request a withdrawal
create or replace function public.request_withdrawal(p_amount numeric(12,2))
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid;
  v_balance   numeric(12,2);
  v_bank      jsonb;
  v_id        uuid;
begin
  -- Get seller
  select id, bank_details into v_seller_id, v_bank
  from public.sellers
  where user_id = auth.uid() and application_status = 'approved';

  if v_seller_id is null then
    raise exception 'No approved seller account found';
  end if;

  -- Check bank details
  if v_bank is null or v_bank = '{}'::jsonb
     or v_bank->>'bank_name' is null or v_bank->>'bank_name' = ''
     or v_bank->>'account_number' is null or v_bank->>'account_number' = '' then
    raise exception 'Please add your bank details in Store Settings first';
  end if;

  -- Validate amount
  if p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  -- Check balance
  v_balance := public.seller_balance();
  if p_amount > v_balance then
    raise exception 'Insufficient balance. Available: R%', v_balance;
  end if;

  -- Create request
  insert into public.withdrawal_requests (seller_id, amount, bank_snapshot)
  values (v_seller_id, p_amount, v_bank)
  returning id into v_id;

  return v_id;
end;
$$;

-- 5. RPC: admin approve/reject/mark-paid
create or replace function public.process_withdrawal(
  p_request_id uuid,
  p_action     text,
  p_notes      text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can process withdrawals';
  end if;

  if p_action = 'approved' then
    update public.withdrawal_requests
    set status = 'approved', admin_notes = p_notes
    where id = p_request_id and status = 'pending';
  elsif p_action = 'rejected' then
    update public.withdrawal_requests
    set status = 'rejected', admin_notes = p_notes, processed_at = now()
    where id = p_request_id and status = 'pending';
  elsif p_action = 'paid' then
    update public.withdrawal_requests
    set status = 'paid', admin_notes = p_notes, processed_at = now()
    where id = p_request_id and status = 'approved';
  else
    raise exception 'Invalid action: %', p_action;
  end if;

  if not found then
    raise exception 'Request not found or already processed';
  end if;
end;
$$;
