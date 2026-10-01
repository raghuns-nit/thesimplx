/*
# Add editable landing and About Us content

1. New settings columns
- `settings.hero_description` (text): editable supporting sentence shown below the landing-page headline.
- `settings.about_history` (text): editable firm history and About Us copy shown on the We Are page.
- `settings.about_profiles` (jsonb array): up to four editable management profile records, each containing a name, role, and image URL.

2. Existing data
- `hero_description` is initialized with the current landing-page description.
- `about_history` starts empty so the admin can add the firm's history.
- `about_profiles` starts as an empty array.

3. Security
- Existing settings RLS policies remain unchanged. Public visitors can read the content and authenticated administrators can update it through the existing Settings screen.

4. Important notes
- This migration only adds columns and seed values; no existing product, category, enquiry, or activity data is changed.
- Profile image files continue to use the existing product-images storage bucket and administrator upload flow.
*/

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS hero_description text NOT NULL DEFAULT 'Browse our catalog of tiles, sanitary ware, fittings, and construction supplies. Get instant WhatsApp quotes and pay via UPI.',
  ADD COLUMN IF NOT EXISTS about_history text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS about_profiles jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE settings
SET hero_description = 'Browse our catalog of tiles, sanitary ware, fittings, and construction supplies. Get instant WhatsApp quotes and pay via UPI.'
WHERE hero_description IS NULL OR btrim(hero_description) = '';

UPDATE settings
SET about_profiles = '[]'::jsonb
WHERE about_profiles IS NULL OR jsonb_typeof(about_profiles) <> 'array';