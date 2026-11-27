/*
# Create brands table

## Summary
Adds a `brands` table so the merchant can showcase brands with a name, logo
image, description, and external URL. Each brand entry can be referenced from
products (the product `brand` text field stays free-text / editable, but the
admin form offers a dropdown of known brand names). On the storefront, a
"Brands" page lists all brands as cards; clicking a brand shows all products
matching that brand name with an in-brand search.

## 1. New Tables
- `brands`
  - `id` (uuid, primary key)
  - `name` (text, not null) — brand name; matched against `products.brand`
  - `slug` (text, not null, unique) — URL-safe slug used in routes
  - `description` (text, nullable) — short brand description
  - `url` (text, nullable) — external brand website / page
  - `image_url` (text, nullable) — brand logo / display image (public URL
    from the `product-images` storage bucket)
  - `sort_order` (integer, not null, default 0)
  - `created_at` (timestamptz, default now())

## 2. Security
- Enable RLS on `brands`.
- This is a no-auth-public-storefront app: the anon-key frontend must be able
  to read brands (public storefront) and admin (authenticated) manages them.
  SELECT is therefore open to `anon, authenticated`; writes are
  `authenticated` only (admin portal behind sign-in).
- Grant SELECT to `anon, authenticated`; INSERT/UPDATE/DELETE to
  `authenticated` only.
- `USING (true)` on the SELECT policy is acceptable because brand data is
  intentionally public (catalog browsing).
*/

CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  url text,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON brands TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON brands TO authenticated;

DROP POLICY IF EXISTS "anon_select_brands" ON brands;
CREATE POLICY "anon_select_brands"
ON brands FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_brands" ON brands;
CREATE POLICY "auth_insert_brands"
ON brands FOR INSERT
TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_brands" ON brands;
CREATE POLICY "auth_update_brands"
ON brands FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_brands" ON brands;
CREATE POLICY "auth_delete_brands"
ON brands FOR DELETE
TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS brands_slug_idx ON brands(slug);
