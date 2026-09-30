-- Remove temporary anon upload policy
DROP POLICY IF EXISTS "temp_anon_insert_product_images" ON storage.objects;