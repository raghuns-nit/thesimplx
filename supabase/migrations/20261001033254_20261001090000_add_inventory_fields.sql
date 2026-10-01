/*
# Add inventory management fields

1. New product columns
- `products.stock_quantity` (numeric, non-negative, defaults to 0): editable inventory quantity with up to two decimal places.
- `products.liquidate_stock` (boolean, defaults to false): admin-only merchandising flag for products that should be liquidated.

2. Existing product data
- Existing products receive `stock_quantity = 0` when no inventory quantity exists.
- Existing products receive `unit = 'Sft'` when their unit is empty or null.

3. Settings
- `settings.low_stock_threshold` (numeric, non-negative, defaults to 10): saved admin threshold used to identify low-stock products.

4. Security
- Existing products and settings RLS policies remain unchanged. The new fields follow the existing public-read and authenticated-admin-write access model.

5. Important notes
- No existing rows are deleted or replaced.
- The liquidation and numeric stock fields are intended for the authenticated admin portal and are not displayed on public product pages.
*/

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock_quantity numeric(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS liquidate_stock boolean NOT NULL DEFAULT false;

UPDATE products
SET unit = 'Sft'
WHERE unit IS NULL OR btrim(unit) = '';

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_stock_quantity_nonnegative;

ALTER TABLE products
  ADD CONSTRAINT products_stock_quantity_nonnegative CHECK (stock_quantity >= 0);

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS low_stock_threshold numeric(12, 2) NOT NULL DEFAULT 10;

ALTER TABLE settings
  DROP CONSTRAINT IF EXISTS settings_low_stock_threshold_nonnegative;

ALTER TABLE settings
  ADD CONSTRAINT settings_low_stock_threshold_nonnegative CHECK (low_stock_threshold >= 0);