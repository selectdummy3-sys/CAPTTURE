-- ============================================================
-- CAPPTURE — Homepage hero content (admin-editable)
-- Table existed in prod via manual dashboard creation; codify it
-- so fresh databases / dev branches match production.
-- ============================================================

begin;

create table if not exists public.hero_content (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  subtitle text not null default '',
  image_url text,
  image_position text not null default 'center',
  cta_text text not null default '',
  cta_link text not null default '/shop',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hero_content enable row level security;

drop policy if exists "Anyone can view active hero content" on public.hero_content;
create policy "Anyone can view active hero content"
  on public.hero_content for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Admins can manage hero content" on public.hero_content;
create policy "Admins can manage hero content"
  on public.hero_content for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists hero_content_set_updated_at on public.hero_content;
create trigger hero_content_set_updated_at
  before update on public.hero_content
  for each row execute function public.handle_updated_at();

insert into public.hero_content (id, title, subtitle, image_url, image_position, cta_text, cta_link, sort_order, is_active, created_at, updated_at)
values
  ('ecaf1ad3-c43c-4987-b63e-afc5f299f6f3', 'Wear the local label.', 'Shop South African designers, tailors and sneaker sellers. Direct from the maker to your door.', null, 'center', 'Shop now', '/shop', 0, true, now(), now()),
  ('ef1c71ba-bc2d-4fe9-9bed-110509b722e3', 'WEAR BLACK', '', null, 'center', 'Shop now', '/shop', 1, true, now(), now())
on conflict (id) do nothing;

commit;
