/*
# Storage policies for product-images bucket

## Overview
Sets up RLS policies on the product-images storage bucket so:
- Anyone can read (public product/category images)
- Authenticated admins can upload/update/delete
*/

-- Public read access for product images
CREATE POLICY "public_read_product_images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

-- Admin upload/update/delete for product images
CREATE POLICY "admin_insert_product_images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "admin_update_product_images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "admin_delete_product_images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');
