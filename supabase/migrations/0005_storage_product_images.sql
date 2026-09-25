-- ============================================================
-- SNR Naturals — Allow admin product image uploads to Storage
--
-- Problem: the `storage.objects` table has RLS enabled but zero
-- policies, so the admin (authenticated role) upload route
-- `/api/admin/products/upload` gets
--   "new row violates row-level security policy for table objects"
--
-- Fix: add read/write/delete policies on the `product-images`
-- bucket for the authenticated role. The bucket is public, so
-- storefront visitors can view images without any policy.
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;

CREATE POLICY "authenticated select product images" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "authenticated insert product images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "authenticated update product images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images')
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "authenticated delete product images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images');