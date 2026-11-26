-- Broaden allowed MIME types for the product-images bucket so small
-- images with uncommon or missing browser-detected types upload fine.
-- Raises the file size limit to 10MB and accepts any image/* type.
UPDATE storage.buckets
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/bmp',
      'image/svg+xml',
      'image/avif',
      'image/heic',
      'image/heif'
    ]
WHERE id = 'product-images';
