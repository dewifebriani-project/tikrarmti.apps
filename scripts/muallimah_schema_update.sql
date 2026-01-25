-- ============================================================================
-- SQL UPDATE STATEMENTS FOR MUALLIMAH REGISTRATION CHANGES
-- ============================================================================
-- Run these SQL statements to update the muallimah_registrations table
-- for the new form structure.
--
-- Execute with:
--   psql -U postgres -d your_database -f scripts/muallimah_schema_update.sql
--
-- Or via Supabase SQL Editor:
--   Copy and paste this script into the SQL Editor
-- ============================================================================

-- Add new columns to muallimah_registrations table
ALTER TABLE public.muallimah_registrations
  ADD COLUMN IF NOT EXISTS class_type text CHECK (class_type = ANY (ARRAY['tashih_ujian'::text, 'tashih_only'::text, 'ujian_only'::text]));

ALTER TABLE public.muallimah_registrations
  ADD COLUMN IF NOT EXISTS preferred_max_thalibah integer;

-- Set default class_type for existing records
UPDATE public.muallimah_registrations
SET class_type = 'tashih_ujian'
WHERE class_type IS NULL;

-- Create index on class_type for better query performance
CREATE INDEX IF NOT EXISTS idx_muallimah_registrations_class_type
  ON public.muallimah_registrations(class_type);

-- Create index on preferred_max_thalibah for better query performance
CREATE INDEX IF NOT EXISTS idx_muallimah_registrations_preferred_max_thalibah
  ON public.muallimah_registrations(preferred_max_thalibah);

-- ============================================================================
-- NOTES:
-- ============================================================================
--
-- 1. memorization_level field:
--    - Kept for backward compatibility but no longer used in the form
--    - Existing data is preserved
--
-- 2. timezone field:
--    - Already has 'WIB' as default (no changes needed)
--    - Form now always submits 'WIB' as the timezone value
--
-- 3. paid_class_interest JSONB field format:
--    The format has changed from checkbox days (array) to single day (radio button)
--
--    OLD FORMAT (if any):
--    {
--      name: string,
--      schedule1_days: string[],  <-- Array of days
--      schedule1_time_start: string,
--      schedule1_time_end: string,
--      schedule2_days: string[],  <-- Array of days
--      schedule2_time_start: string,
--      schedule2_time_end: string,
--      max_students: number,
--      spp_percentage: string,
--      additional_info: string
--    }
--
--    NEW FORMAT:
--    {
--      name: string,
--      schedule1: { day: string, time_start: string, time_end: string } | null,
--      schedule2: { day: string, time_start: string, time_end: string } | null,
--      max_students: number | null,
--      spp_percentage: string | null,
--      additional_info: string | null
--    }
--
-- 4. Schedule format (preferred_schedule and backup_schedule):
--    Format now includes separate time_start and time_end fields
--
--    OLD FORMAT:
--    { day: string, time: string }
--
--    NEW FORMAT:
--    { day: string, time_start: string, time_end: string }
--
-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
