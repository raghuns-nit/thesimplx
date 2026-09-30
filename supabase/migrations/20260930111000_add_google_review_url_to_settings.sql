/*
# Add Google Review URL to Settings

## Changes
- Adds `google_review_url` (text, nullable) to the `settings` table.
- Stores the Google Maps review link that admins can configure to display
  a Google Reviews ticker/section on the public homepage.

## Security
- No RLS policy changes needed — the existing `public_read_settings` SELECT
  policy (TO anon, authenticated) already covers the new column, and the
  existing `admin_update_settings` / `admin_insert_settings` policies cover
  writes by authenticated admins.
*/

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS google_review_url text;
