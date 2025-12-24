-- ============================================================================
-- SQL MIGRATION: Add Timeline Phase Fields to Batches Table
-- ============================================================================
-- Purpose: Add timeline phase date fields to make perjalanan-saya page dynamic
-- Execute with: psql -U postgres -d your_database -f batches_timeline_fields_migration.sql
-- ============================================================================

-- Add timeline phase date fields
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS selection_start_date DATE,
ADD COLUMN IF NOT EXISTS selection_end_date DATE,
ADD COLUMN IF NOT EXISTS selection_result_date DATE,
ADD COLUMN IF NOT EXISTS re_enrollment_date DATE,
ADD COLUMN IF NOT EXISTS opening_class_date DATE,
ADD COLUMN IF NOT EXISTS first_week_start_date DATE,
ADD COLUMN IF NOT EXISTS first_week_end_date DATE,
ADD COLUMN IF NOT EXISTS review_week_start_date DATE,
ADD COLUMN IF NOT EXISTS review_week_end_date DATE,
ADD COLUMN IF NOT EXISTS final_exam_start_date DATE,
ADD COLUMN IF NOT EXISTS final_exam_end_date DATE,
ADD COLUMN IF NOT EXISTS graduation_start_date DATE,
ADD COLUMN IF NOT EXISTS graduation_end_date DATE;

-- Add comments to document each field
COMMENT ON COLUMN public.batches.selection_start_date IS 'Start date of selection phase (tests and interviews)';
COMMENT ON COLUMN public.batches.selection_end_date IS 'End date of selection phase';
COMMENT ON COLUMN public.batches.selection_result_date IS 'Date when selection results are announced';
COMMENT ON COLUMN public.batches.re_enrollment_date IS 'Date for re-enrollment confirmation';
COMMENT ON COLUMN public.batches.opening_class_date IS 'Date of opening class (Kelas Perdana Gabungan)';
COMMENT ON COLUMN public.batches.first_week_start_date IS 'Start date of first learning week (Pekan 1 - Tashih)';
COMMENT ON COLUMN public.batches.first_week_end_date IS 'End date of first learning week';
COMMENT ON COLUMN public.batches.review_week_start_date IS 'Start date of review/muraja''ah week (Pekan 12)';
COMMENT ON COLUMN public.batches.review_week_end_date IS 'End date of review week';
COMMENT ON COLUMN public.batches.final_exam_start_date IS 'Start date of final exam week (Pekan 13)';
COMMENT ON COLUMN public.batches.final_exam_end_date IS 'End date of final exam week';
COMMENT ON COLUMN public.batches.graduation_start_date IS 'Start date of graduation week (Wisuda & Kelulusan)';
COMMENT ON COLUMN public.batches.graduation_end_date IS 'End date of graduation week';

-- ============================================================================
-- SAMPLE DATA UPDATE (Optional - for testing)
-- ============================================================================
-- Update existing batches with sample timeline data
-- Uncomment and modify as needed

/*
UPDATE public.batches
SET
  selection_start_date = registration_end_date + INTERVAL '1 day',
  selection_end_date = registration_end_date + INTERVAL '14 days',
  selection_result_date = registration_end_date + INTERVAL '15 days',
  re_enrollment_date = registration_end_date + INTERVAL '16 days',
  opening_class_date = start_date,
  first_week_start_date = start_date,
  first_week_end_date = start_date + INTERVAL '6 days',
  review_week_start_date = start_date + INTERVAL '77 days', -- Week 12 starts (11 weeks * 7 days)
  review_week_end_date = start_date + INTERVAL '83 days',
  final_exam_start_date = start_date + INTERVAL '84 days', -- Week 13 starts
  final_exam_end_date = start_date + INTERVAL '90 days',
  graduation_start_date = start_date + INTERVAL '91 days', -- Week 14 starts
  graduation_end_date = end_date
WHERE status = 'draft' OR status = 'open';
*/

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Check the updated table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'batches'
AND column_name LIKE '%date%'
ORDER BY ordinal_position;

-- ============================================================================
-- DONE
-- ============================================================================
