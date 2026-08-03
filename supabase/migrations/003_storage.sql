-- ============================================================
-- CAPPTURE — Storage buckets and policies
-- ============================================================

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('store-assets',    'store-assets',    true,  5242880,   array['image/png','image/jpeg','image/webp','image/svg+xml']),
  ('product-images',  'product-images',  true,  10485760,  array['image/png','image/jpeg','image/webp']),
  ('documents',       'documents',       false, 10485760,  array['image/png','image/jpeg','image/webp','application/pdf'])
on conflict (id) do nothing;

-- ---------- Public buckets: anyone may read ----------
create policy "store_assets_public_read"
  on storage.objects for select
  using (bucket_id = 'store-assets');

create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- ---------- Private documents: owner + admin read ----------
create policy "documents_owner_read"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "documents_admin_read"
  on storage.objects for select
  using (bucket_id = 'documents' and public.is_admin());

-- ---------- Upload / update / delete scoped to user folder ----------
create policy "authenticated_upload_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('store-assets', 'product-images', 'documents')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "authenticated_update_own_folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('store-assets', 'product-images', 'documents')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "authenticated_delete_own_folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('store-assets', 'product-images', 'documents')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admin full access to object storage.
create policy "admin_objects_all"
  on storage.objects for all
  using (public.is_admin());

commit;
