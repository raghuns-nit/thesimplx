/*
# Add Visual Signature Column to Products

## Purpose
Adds a `visual_signature` column to the `products` table to store a compact
color/texture fingerprint for each product image. This signature is used by
the Visual Search feature to find products that look similar to a customer's
uploaded photo — no external AI service required.

## Changes
1. **products table** — new column:
   - `visual_signature` (jsonb, nullable) — stores an array of numbers
     representing dominant colors (RGB buckets), brightness, and texture
     features extracted from the product's first image via browser canvas.

2. **Security** — a SECURITY DEFINER function `update_product_signature`:
   - Allows any visitor (anon + authenticated) to update ONLY the
     `visual_signature` column for a given product ID.
   - Cannot modify any other column — the function accepts just the product
     ID and the signature value, and issues a targeted UPDATE.
   - This is safe because the signature is non-sensitive metadata and the
     function is restricted to that single column.

3. **RLS** — no policy changes needed. The existing `public_read_products`
   SELECT policy already allows anon to read all columns including the new
   one. The SECURITY DEFINER function bypasses RLS for the targeted UPDATE,
   which is the intended design (anon cannot UPDATE products directly; only
   this function can, and only the signature column).

## Notes
- The signature is computed in the browser and sent back to the database.
- First visit to the Visual Search page triggers signature computation for
  any products missing one; subsequent visits use cached signatures.
- The column is nullable so existing products work fine before signatures
  are computed.
*/

-- Add the visual_signature column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'visual_signature'
  ) THEN
    ALTER TABLE products ADD COLUMN visual_signature jsonb;
  END IF;
END $$;

-- Create a SECURITY DEFINER function that allows anyone to update
-- ONLY the visual_signature column for a product.
-- This bypasses RLS safely because it touches only the signature column.
CREATE OR REPLACE FUNCTION public.update_product_signature(
  p_product_id uuid,
  p_signature jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET visual_signature = p_signature
  WHERE id = p_product_id;
END;
$$;

-- Grant execute to anon and authenticated so the browser client can call it
GRANT EXECUTE ON FUNCTION public.update_product_signature(uuid, jsonb) TO anon, authenticated;