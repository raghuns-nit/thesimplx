/*
# Add product notes and editable colour options

1. Product changes
- Add `products.notes` (text, nullable) for optional internal/customer-facing product notes.
- Existing product colour values remain in the existing `specifications.color` field.

2. Settings changes
- Add `settings.product_colour_options` (jsonb array of text values) to control the colour dropdown in the admin product editor.
- Seed the requested default values: Black, Blue, Red, Yellow, Green, White, and Cream.

3. Security
- Preserve the existing public product/settings read policies and authenticated admin write policies.
- Re-grant the existing table access explicitly so the new columns are available through the Data API.

4. Important notes
- Existing products and settings remain unchanged apart from receiving the new nullable/default fields.
- Removing a colour option does not erase it from products that already use it; those products continue to display their saved colour and can be edited with a custom value.
*/

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS product_colour_options jsonb NOT NULL DEFAULT '["Black", "Blue", "Red", "Yellow", "Green", "White", "Cream"]'::jsonb;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO anon, authenticated;
