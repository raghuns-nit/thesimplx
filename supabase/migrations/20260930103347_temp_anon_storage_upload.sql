-- Temporary: allow anon to upload images for bulk import
CREATE POLICY "temp_anon_insert_product_images"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'product-images');