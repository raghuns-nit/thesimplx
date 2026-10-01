/*
# Add visual search configuration

1. New settings columns
- `settings.visual_search_threshold` (numeric, default 50): minimum similarity percentage required for a match.
- `settings.visual_search_max_results` (integer, default 12): maximum matches shown in one visual-search result set.
- `settings.visual_search_color_weight` (numeric, default 70): percentage weight for the HSV color signature.
- `settings.visual_search_brightness_weight` (numeric, default 15): percentage weight for brightness similarity.
- `settings.visual_search_texture_weight` (numeric, default 10): percentage weight for edge/texture similarity.
- `settings.visual_search_variance_weight` (numeric, default 5): percentage weight for color-variation similarity.

2. Existing behavior
- Current visual-search behavior is preserved with the defaults above.
- Signature extraction remains version 2 at 64x64 pixels with 30 HSV color buckets; these algorithm details are shown in the admin settings as reference values.

3. Security
- Existing settings RLS policies remain unchanged. Public pages can read these search configuration values, while only authenticated admins can update them.

4. Important notes
- Values are constrained to safe non-negative ranges.
- No product or signature data is deleted or rewritten by this migration.
*/

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS visual_search_threshold numeric(5, 2) NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS visual_search_max_results integer NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS visual_search_color_weight numeric(5, 2) NOT NULL DEFAULT 70,
  ADD COLUMN IF NOT EXISTS visual_search_brightness_weight numeric(5, 2) NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS visual_search_texture_weight numeric(5, 2) NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS visual_search_variance_weight numeric(5, 2) NOT NULL DEFAULT 5;

ALTER TABLE settings
  DROP CONSTRAINT IF EXISTS settings_visual_search_threshold_valid,
  DROP CONSTRAINT IF EXISTS settings_visual_search_max_results_valid,
  DROP CONSTRAINT IF EXISTS settings_visual_search_weights_valid;

ALTER TABLE settings
  ADD CONSTRAINT settings_visual_search_threshold_valid CHECK (visual_search_threshold >= 0 AND visual_search_threshold <= 100),
  ADD CONSTRAINT settings_visual_search_max_results_valid CHECK (visual_search_max_results >= 1 AND visual_search_max_results <= 50),
  ADD CONSTRAINT settings_visual_search_weights_valid CHECK (
    visual_search_color_weight >= 0 AND
    visual_search_brightness_weight >= 0 AND
    visual_search_texture_weight >= 0 AND
    visual_search_variance_weight >= 0 AND
    visual_search_color_weight + visual_search_brightness_weight + visual_search_texture_weight + visual_search_variance_weight > 0
  );