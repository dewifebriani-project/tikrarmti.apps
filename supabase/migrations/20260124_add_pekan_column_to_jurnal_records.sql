-- =====================================================
-- ADD pekan COLUMN TO jurnal_records
-- =====================================================
-- Purpose: Add pekan (week) column to jurnal_records
--          to track which week a jurnal entry belongs to
-- Created: 2026-01-24
-- =====================================================

-- Add pekan column to jurnal_records
ALTER TABLE public.jurnal_records
ADD COLUMN IF NOT EXISTS pekan integer NULL;

-- Add check constraint to ensure pekan is between 1-10 if not null
ALTER TABLE public.jurnal_records
ADD CONSTRAINT jurnal_records_pekan_check
CHECK (pekan IS NULL OR (pekan >= 1 AND pekan <= 10));

-- Add comment for documentation
COMMENT ON COLUMN public.jurnal_records.pekan IS
  'Week number (1-10) for the jurnal entry. Used for tracking weekly progress.';

-- Verify the column was added
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'jurnal_records'
  AND column_name = 'pekan';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
