/*
# Add archived flag to enquiries

## Summary
Adds an `archived` boolean column to the `enquiries` table so admins can
archive enquiries they no longer need in the active list. Archived enquiries
are kept in the database and shown in a separate "Archived" view under the
Enquiries tab.

## 1. Schema changes
- `enquiries.archived` (boolean, not null, default false): when true, the
  enquiry is archived and excluded from the active list. Existing rows default
  to false (not archived).

## 2. Security
- No new tables. RLS on `enquiries` is unchanged (already open to
  `anon, authenticated` — public storefront submits enquiries, admin manages
  them). No policy changes required: `archived` is written by the same roles
  that already UPDATE enquiries.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'enquiries' AND column_name = 'archived'
  ) THEN
    ALTER TABLE enquiries ADD COLUMN archived boolean NOT NULL DEFAULT false;
  END IF;
END $$;
