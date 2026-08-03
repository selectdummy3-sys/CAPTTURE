-- 019: Fix storage RLS — replace fragile storage.foldername() check with starts_with()
-- Also add a proper SELECT policy for store-assets & product-images public reads

-- ─── Drop the old INSERT policy ───────────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_upload_own_folder" ON storage.objects;

-- ─── New INSERT policy: authenticated users can upload to their own folder ────
-- Uses starts_with() instead of storage.foldername() which can be unreliable
CREATE POLICY "authenticated_insert_own_folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('store-assets', 'product-images', 'documents')
    AND starts_with(name, auth.uid()::text || '/')
  );

-- ─── New SELECT policy: authenticated users can read all store-assets ──────────
-- (needed so uploaded logos/banners display immediately after upload)
DROP POLICY IF EXISTS "store_assets_auth_read" ON storage.objects;
CREATE POLICY "store_assets_auth_read"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id IN ('store-assets', 'product-images')
  );

-- ─── Public read for store-assets and product-images (keeps existing behaviour) ─
DROP POLICY IF EXISTS "store_assets_public_read" ON storage.objects;
CREATE POLICY "store_assets_public_read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id IN ('store-assets', 'product-images')
  );
