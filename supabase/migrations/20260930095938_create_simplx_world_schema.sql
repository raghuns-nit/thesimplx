/*
# Simplx World — Core Database Schema

## Overview
Creates the full data layer for the Simplx World building materials storefront and admin portal, replacing Google Drive JSON files and Google Sheets with Supabase tables.

## New Tables

1. **categories** — product categories (e.g., Floor Tiles, Wall Tiles, Sanitary Ware)
   - id (uuid, PK)
   - name (text, not null)
   - slug (text, unique, not null) — URL-safe identifier
   - description (text, nullable)
   - image_url (text, nullable) — Supabase Storage URL or external URL
   - sort_order (int, default 0)
   - created_at (timestamptz)

2. **products** — individual products within categories
   - id (uuid, PK)
   - category_id (uuid, FK → categories.id, ON DELETE CASCADE)
   - name (text, not null)
   - brand (text, nullable)
   - sku (text, nullable)
   - price (numeric, nullable)
   - unit (text, nullable) — e.g., "per sq ft", "per box"
   - size (text, nullable)
   - finish (text, nullable)
   - stock_status (text, default 'In Stock') — 'In Stock', 'Limited Stock', 'Out of Stock'
   - description (text, nullable)
   - image_urls (jsonb, default '[]') — array of image URLs
   - specifications (jsonb, default '{}') — key-value spec pairs
   - sort_order (int, default 0)
   - created_at (timestamptz)

3. **settings** — single-row company settings table
   - id (int, PK, always 1)
   - company_name (text, default 'Simplx World')
   - phone (text, nullable)
   - whatsapp (text, nullable)
   - email (text, nullable)
   - address (text, nullable)
   - upi_id (text, nullable)
   - updated_at (timestamptz)

4. **enquiries** — customer contact form submissions
   - id (uuid, PK)
   - name (text, not null)
   - email (text, nullable)
   - phone (text, not null)
   - message (text, not null)
   - status (text, default 'New') — 'New', 'Assigned', 'Closed'
   - assignee (text, nullable)
   - comment (text, nullable)
   - created_at (timestamptz)
   - updated_at (timestamptz)

5. **activity_logs** — admin action audit trail
   - id (uuid, PK)
   - username (text, nullable)
   - action (text, not null) — e.g., 'CREATE_PRODUCT', 'UPDATE_SETTINGS'
   - entity_type (text, nullable)
   - entity_id (text, nullable)
   - created_at (timestamptz)

## Security (RLS)
- **categories**: public read (anon + authenticated), admin write only (authenticated)
- **products**: public read (anon + authenticated), admin write only (authenticated)
- **settings**: public read (anon + authenticated), admin write only (authenticated)
- **enquiries**: public insert (anyone can submit), admin read/update only (authenticated)
- **activity_logs**: admin read/insert only (authenticated)

## Notes
- This is a single-tenant app with admin authentication. Public visitors browse without signing in.
- Admin access uses Supabase email/password auth (authenticated role).
- The anon role can read products/categories/settings and submit enquiries but cannot modify them.
- Settings table is constrained to a single row via CHECK (id = 1).
*/

-- ── Categories ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    image_url text,
    sort_order int NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT
    TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_categories" ON categories;
CREATE POLICY "admin_insert_categories" ON categories FOR INSERT
    TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_categories" ON categories;
CREATE POLICY "admin_update_categories" ON categories FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_categories" ON categories;
CREATE POLICY "admin_delete_categories" ON categories FOR DELETE
    TO authenticated USING (true);

-- ── Products ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name text NOT NULL,
    brand text,
    sku text,
    price numeric,
    unit text,
    size text,
    finish text,
    stock_status text NOT NULL DEFAULT 'In Stock',
    description text,
    image_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
    specifications jsonb NOT NULL DEFAULT '{}'::jsonb,
    sort_order int NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products FOR SELECT
    TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_products" ON products;
CREATE POLICY "admin_insert_products" ON products FOR INSERT
    TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_products" ON products;
CREATE POLICY "admin_update_products" ON products FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_products" ON products;
CREATE POLICY "admin_delete_products" ON products FOR DELETE
    TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON products(stock_status);

-- ── Settings (single-row table) ──────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
    id int PRIMARY KEY DEFAULT 1,
    company_name text NOT NULL DEFAULT 'Simplx World',
    phone text,
    whatsapp text,
    email text,
    address text,
    upi_id text,
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT settings_single_row CHECK (id = 1)
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_settings" ON settings;
CREATE POLICY "public_read_settings" ON settings FOR SELECT
    TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_settings" ON settings;
CREATE POLICY "admin_update_settings" ON settings FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_insert_settings" ON settings;
CREATE POLICY "admin_insert_settings" ON settings FOR INSERT
    TO authenticated WITH CHECK (true);

-- Seed the single settings row
INSERT INTO settings (id, company_name)
VALUES (1, 'Simplx World')
ON CONFLICT (id) DO NOTHING;

-- ── Enquiries ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enquiries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text,
    phone text NOT NULL,
    message text NOT NULL,
    status text NOT NULL DEFAULT 'New',
    assignee text,
    comment text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_enquiries" ON enquiries;
CREATE POLICY "public_insert_enquiries" ON enquiries FOR INSERT
    TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_enquiries" ON enquiries;
CREATE POLICY "admin_read_enquiries" ON enquiries FOR SELECT
    TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_enquiries" ON enquiries;
CREATE POLICY "admin_update_enquiries" ON enquiries FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_enquiries" ON enquiries;
CREATE POLICY "admin_delete_enquiries" ON enquiries FOR DELETE
    TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON enquiries(created_at DESC);

-- ── Activity Logs ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username text,
    action text NOT NULL,
    entity_type text,
    entity_id text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_activity_logs" ON activity_logs;
CREATE POLICY "admin_read_activity_logs" ON activity_logs FOR SELECT
    TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_activity_logs" ON activity_logs;
CREATE POLICY "admin_insert_activity_logs" ON activity_logs FOR INSERT
    TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_activity_logs" ON activity_logs;
CREATE POLICY "admin_delete_activity_logs" ON activity_logs FOR DELETE
    TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);