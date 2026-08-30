-- 048: hero slides can now carry a background campaign video managed from the admin dashboard.
alter table public.hero_content
  add column if not exists video_url text;