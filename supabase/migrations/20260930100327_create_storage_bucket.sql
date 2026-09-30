/*
# Create product-images storage bucket

## Overview
Creates a public storage bucket for product and category images.
Previously images were stored in Google Drive; now they go to Supabase Storage.

## Changes
- Creates storage bucket "product-images" (public, 5MB file size limit)
- No RLS policies needed on the bucket itself since it's public for reads
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;