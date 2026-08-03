-- 017_messages_system.sql
-- Admin ↔ Seller messaging system

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  seller_id   uuid references public.sellers(id) on delete set null,
  subject     text not null,
  body        text not null,
  is_read     boolean not null default false,
  is_bulk     boolean not null default false,
  created_at  timestamptz not null default now()
);

comment on table public.messages is 'Admin-to-seller and bulk messages';

create index if not exists idx_messages_sender   on public.messages (sender_id);
create index if not exists idx_messages_seller   on public.messages (seller_id);
create index if not exists idx_messages_created  on public.messages (created_at desc);

alter table public.messages enable row level security;

create policy "Admins have full access to messages"
  on public.messages for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Sellers can read their messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.sellers s
      where s.user_id = auth.uid()
        and s.application_status = 'approved'
        and (s.id = messages.seller_id or messages.is_bulk = true)
    )
  );

create policy "Sellers can mark messages as read"
  on public.messages for update
  using (
    exists (
      select 1 from public.sellers s
      where s.user_id = auth.uid()
        and s.application_status = 'approved'
        and (s.id = messages.seller_id or messages.is_bulk = true)
    )
  )
  with check (
    exists (
      select 1 from public.sellers s
      where s.user_id = auth.uid()
        and s.application_status = 'approved'
        and (s.id = messages.seller_id or messages.is_bulk = true)
    )
  );

-- RPC: send a message (admin only, supports bulk)
create or replace function public.send_message(
  p_seller_id uuid,
  p_subject   text,
  p_body      text,
  p_is_bulk   boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender uuid;
  v_id     uuid;
begin
  if not public.is_admin() then
    raise exception 'Only admins can send messages';
  end if;

  v_sender := auth.uid();

  if p_is_bulk then
    insert into public.messages (sender_id, seller_id, subject, body, is_bulk)
    select v_sender, s.id, p_subject, p_body, true
    from public.sellers s
    where s.application_status = 'approved';
    return null;
  else
    if p_seller_id is null then
      raise exception 'seller_id is required for direct messages';
    end if;
    insert into public.messages (sender_id, seller_id, subject, body, is_bulk)
    values (v_sender, p_seller_id, p_subject, p_body, false)
    returning id into v_id;
    return v_id;
  end if;
end;
$$;

-- RPC: mark message as read (seller only)
create or replace function public.mark_message_read(p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.messages
  set is_read = true
  where id = p_message_id
    and exists (
      select 1 from public.sellers s
      where s.user_id = auth.uid()
        and s.application_status = 'approved'
        and (s.id = messages.seller_id or messages.is_bulk = true)
    );
end;
$$;

-- RPC: get unread message count for current seller
create or replace function public.unread_message_count()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::int
  from public.messages m
  where m.is_read = false
    and exists (
      select 1 from public.sellers s
      where s.user_id = auth.uid()
        and s.application_status = 'approved'
        and (s.id = m.seller_id or m.is_bulk = true)
    );
$$;
