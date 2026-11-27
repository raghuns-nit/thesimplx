/*
# Add PDF catalog to products

## Summary
Adds an optional PDF catalog link to each product so merchants can attach a
brochure/spec sheet PDF that customers can open in a new browser tab from the
product detail page. Also extends the existing `product-images` storage bucket
to accept `application/pdf` uploads so the PDF can be stored alongside images.

## 1. Schema changes
- `products.catalog_url` (text, nullable): public URL of a PDF catalog stored
  in the `product-images` bucket. Null when no catalog is attached. Existing
  products default to NULL (no catalog).

## 2. Storage changes
- Updates the `product-images` bucket's `allowed_mime_types` to include
  `application/pdf` in addition to the previously allowed image types, so PDF
  uploads are accepted. The size limit remains 10MB.

## 3. Security
- No new tables. RLS on `products` is unchanged (already open to
  `anon, authenticated` for the public storefront + admin).
- No policy changes required: `catalog_url` is written by the same roles that
  already INSERT/UPDATE products and read by the same SELECT policy.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'catalog_url'
  ) THEN
    ALTER TABLE products ADD COLUMN catalog_url text;
  END IF;
END $$;

-- Ensure the product-images bucket accepts PDF catalogs (10MB limit).
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/svg+xml',
    'image/avif',
    'image/heic',
    'image/heif',
    'application/pdf'
  ],
  file_size_limit = 10485760
WHERE id = 'product-images';
