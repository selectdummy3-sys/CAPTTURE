-- 053_support_tickets.sql
-- Customer support tickets raised from the AI support assistant (or manually),
-- with a threaded message log that admins/agents can reply to.
--
-- Access model:
--   * tickets are created server-side (support-ai edge function) using the
--     service role, so there is deliberately no public INSERT policy here.
--   * a signed-in customer can read their own tickets + thread.
--   * admins have full access.
-- Anonymous (not signed in) tickets are allowed and keyed by the email the
-- customer gives during the chat; those rows have user_id = null.

begin;

-- Human-friendly, non-guessable ticket reference: CAPP-000123
create sequence if not exists public.support_ticket_ref_seq;

create table if not exists public.support_tickets (
  id              uuid primary key default gen_random_uuid(),
  reference       text not null unique
                    default ('CAPP-' || lpad(nextval('public.support_ticket_ref_seq')::text, 6, '0')),
  user_id         uuid references auth.users(id) on delete set null,
  email           text,
  order_number    text,
  category        text not null default 'general',
  priority        text not null default 'normal'
                    check (priority in ('low', 'normal', 'high', 'urgent')),
  status          text not null default 'open'
                    check (status in ('open', 'pending', 'resolved', 'closed')),
  source          text not null default 'ai_chat'
                    check (source in ('ai_chat', 'email', 'manual')),
  subject         text not null,
  summary         text,
  assigned_to     uuid references public.profiles(id) on delete set null,
  last_message_at timestamptz not null default now(),
  closed_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.support_tickets is
  'Customer support tickets (own-read via RLS, admin full access). Rows are created server-side by support-ai.';

create index if not exists support_tickets_user_idx     on public.support_tickets (user_id);
create index if not exists support_tickets_status_idx   on public.support_tickets (status);
create index if not exists support_tickets_created_idx  on public.support_tickets (created_at desc);
create index if not exists support_tickets_email_idx    on public.support_tickets (lower(email));

create trigger support_tickets_updated_at
  before update on public.support_tickets
  for each row execute procedure public.handle_updated_at();

-- ------------------------------------------------------------------
-- Threaded messages on a ticket.
-- ------------------------------------------------------------------
create table if not exists public.support_ticket_messages (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.support_tickets(id) on delete cascade,
  author_type text not null default 'customer'
                check (author_type in ('customer', 'agent', 'ai', 'system')),
  author_id   uuid references public.profiles(id) on delete set null,
  body        text not null check (length(trim(body)) > 0),
  created_at  timestamptz not null default now()
);

comment on table public.support_ticket_messages is 'Threaded replies on a support ticket';

create index if not exists support_ticket_messages_ticket_idx
  on public.support_ticket_messages (ticket_id, created_at);

-- Keep the parent ticket's last_message_at fresh on every reply.
create or replace function public.touch_ticket_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.support_tickets
  set last_message_at = now(),
      updated_at = now(),
      status = case when status = 'closed' then 'open' else status end,
      closed_at = case when status = 'closed' then null else closed_at end
  where id = new.ticket_id;
  return new;
end;
$$;

create trigger support_ticket_messages_touch
  after insert on public.support_ticket_messages
  for each row execute procedure public.touch_ticket_on_message();

revoke execute on function public.touch_ticket_on_message() from anon, authenticated, public;

-- ------------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------------
alter table public.support_tickets enable row level security;

create policy "support_tickets_select_own"
  on public.support_tickets for select
  using (user_id = auth.uid());

create policy "support_tickets_admin_all"
  on public.support_tickets for all
  using (public.is_admin())
  with check (public.is_admin());

alter table public.support_ticket_messages enable row level security;

create policy "support_ticket_messages_select_own"
  on public.support_ticket_messages for select
  using (
    exists (
      select 1 from public.support_tickets t
      where t.id = support_ticket_messages.ticket_id
        and t.user_id = auth.uid()
    )
  );

create policy "support_ticket_messages_insert_own"
  on public.support_ticket_messages for insert
  with check (
    author_type = 'customer'
    and exists (
      select 1 from public.support_tickets t
      where t.id = support_ticket_messages.ticket_id
        and t.user_id = auth.uid()
    )
  );

create policy "support_ticket_messages_admin_all"
  on public.support_ticket_messages for all
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------------
-- Admin: update a ticket's status (and optionally priority).
-- ------------------------------------------------------------------
create or replace function public.set_support_ticket_status(
  p_ticket_id uuid,
  p_status    text,
  p_priority  text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can update support tickets';
  end if;
  if p_status not in ('open', 'pending', 'resolved', 'closed') then
    raise exception 'invalid status';
  end if;
  if p_priority is not null and p_priority not in ('low', 'normal', 'high', 'urgent') then
    raise exception 'invalid priority';
  end if;

  update public.support_tickets
  set status = p_status,
      priority = coalesce(p_priority, priority),
      closed_at = case when p_status = 'closed' then now() else null end,
      updated_at = now()
  where id = p_ticket_id;
end;
$$;

revoke all on function public.set_support_ticket_status(uuid, text, text) from public;
grant execute on function public.set_support_ticket_status(uuid, text, text) to authenticated;

commit;
