-- 047_saved_addresses.sql
-- Saved delivery addresses for buyers.
-- Each row belongs to exactly one authenticated user; RLS restricts all
-- CRUD to the row owner. Orders keep their own shipping_address JSONB
-- snapshot (see place_order) so later profile changes can never rewrite an
-- already-placed order.

begin;

create table public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  recipient   text not null check (length(trim(recipient)) > 0),
  phone       text not null check (phone ~ '^[0-9+ ()-]{7,20}$'),
  line1       text not null check (length(trim(line1)) > 0),
  line2       text,
  city        text not null check (length(trim(city)) > 0),
  province    text not null check (length(trim(province)) > 0),
  postal_code text not null check (length(trim(postal_code)) > 0),
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.addresses is 'Buyer saved delivery addresses (own-only via RLS)';

create index addresses_user_idx on public.addresses (user_id);

create trigger addresses_updated_at
  before update on public.addresses
  for each row execute procedure public.handle_updated_at();

-- First address a user saves becomes their default.
create or replace function public.ensure_first_address_default()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if not new.is_default then
    select count(*) into v_count from public.addresses where user_id = new.user_id;
    if v_count = 0 then
      new.is_default := true;
    end if;
  end if;
  return new;
end;
$$;

create trigger addresses_first_default
  before insert on public.addresses
  for each row execute procedure public.ensure_first_address_default();

revoke execute on function public.ensure_first_address_default() from anon, authenticated, public;

-- ------------------------------------------------------------------
-- RLS: strictly own-row access.
-- ------------------------------------------------------------------
alter table public.addresses enable row level security;

create policy "addresses_select_own" on public.addresses for select
  using (user_id = auth.uid());

create policy "addresses_insert_own" on public.addresses for insert
  with check (user_id = auth.uid());

create policy "addresses_update_own" on public.addresses for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "addresses_delete_own" on public.addresses for delete
  using (user_id = auth.uid());

-- ------------------------------------------------------------------
-- Make one of the caller's addresses the default (clears the others).
-- ------------------------------------------------------------------
create or replace function public.set_default_address(p_address_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.addresses where id = p_address_id and user_id = auth.uid()
  ) then
    raise exception 'address not found';
  end if;

  update public.addresses set is_default = false where user_id = auth.uid();
  update public.addresses set is_default = true where id = p_address_id;
end;
$$;

revoke all on function public.set_default_address(uuid) from public;
grant execute on function public.set_default_address(uuid) to authenticated;

commit;