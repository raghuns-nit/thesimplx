/*
# Add configurable company logo to settings

1. Settings changes
- Add `settings.logo_url` (text, nullable) to store the uploaded company logo URL.
- When null, the site falls back to the bundled `/logo.svg` asset.

2. Security
- Preserve the existing public settings read policy and authenticated admin write policy.
- Re-grant table access explicitly so the new column is available through the Data API.

3. Important notes
- The logo is uploaded to the existing public `product-images` storage bucket under a `branding` folder, so it is reachable from the browser without a signed URL.
- Existing settings rows remain unchanged; the new column is nullable and defaults to null.
*/

ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS logo_url text;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO anon, authenticated;
