-- ============================================================
-- CAPPTURE — FCM push notifications
-- ============================================================

begin;

-- pg_net lets DB triggers fire the push-send edge function
create extension if not exists "pg_net";

-- ---------- push_tokens ----------
create table public.push_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  token      text not null,
  platform   text not null default 'android'
             check (platform in ('android', 'ios', 'web')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, token)
);

create index push_tokens_user_idx on public.push_tokens (user_id);

create trigger push_tokens_updated_at
  before update on public.push_tokens
  for each row execute procedure public.handle_updated_at();

alter table public.push_tokens enable row level security;

create policy push_tokens_select_own on public.push_tokens
  for select using (auth.uid() = user_id);
create policy push_tokens_insert_own on public.push_tokens
  for insert with check (auth.uid() = user_id);
create policy push_tokens_update_own on public.push_tokens
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy push_tokens_delete_own on public.push_tokens
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.push_tokens to authenticated;

-- Edge functions that run with the service role need to write notifications
-- (e.g. order-notify creating a buyer status notification).
grant execute on function public.notify_user(uuid, text, text, text, jsonb) to service_role;

-- ---------- shared webhook secret (vault) ----------
-- The DB trigger and the push-send edge function both read this from vault,
-- so no env secret has to be kept in sync manually.
insert into vault.secrets (name, secret, description)
values ('push_webhook_secret', 'wh_' || gen_random_uuid()::text, 'Used by notifications trigger -> push-send edge function')
on conflict (name) do nothing;

create or replace function public.get_push_webhook_secret()
returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'push_webhook_secret'
  limit 1;
  return v_secret;
end;
$$;

revoke all on function public.get_push_webhook_secret() from public;
grant execute on function public.get_push_webhook_secret() to service_role;

-- ---------- dispatch push on every new notification ----------
create or replace function public.dispatch_notifications_push_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
  v_url    text := 'https://kzotycqormnbgvcpktdv.supabase.co/functions/v1/push-send';
begin
  v_secret := public.get_push_webhook_secret();
  if v_secret is null then
    return new;
  end if;

  perform net.http_post(
    url     := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-secret', v_secret
    ),
    body    := jsonb_build_object('notification_id', new.id, 'user_id', new.user_id),
    timeout_milliseconds := 5000
  );

  return new;
end;
$$;

create trigger notifications_dispatch_push
  after insert on public.notifications
  for each row execute procedure public.dispatch_notifications_push_trigger();

commit;