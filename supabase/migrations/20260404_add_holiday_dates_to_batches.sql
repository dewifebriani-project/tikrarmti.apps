-- ============================================================================
-- Migration: Add Holiday Dates to Batches
-- Date: 2026-04-04
-- Description: Adds a JSONB column to the batches table to store holiday dates
--              which can be used to shift the schedule/weeks.
-- ============================================================================

ALTER TABLE public.batches 
ADD COLUMN IF NOT EXISTS holiday_dates JSONB DEFAULT '[]'::jsonb;

-- Optional: Comment for documentation
COMMENT ON COLUMN public.batches.holiday_dates IS 'Array of date strings (YYYY-MM-DD) representing holidays or breaks in the batch schedule.';
