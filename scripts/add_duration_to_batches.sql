-- Add duration_weeks column to batches table
-- Run this in Supabase SQL Editor

-- Add duration_weeks column if it doesn't exist
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS duration_weeks INTEGER DEFAULT 0;

-- Create a function to update duration_weeks based on start_date and end_date
CREATE OR REPLACE FUNCTION calculate_batch_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate duration in weeks when both dates are available
  IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL THEN
    -- Calculate the difference in days and convert to weeks
    NEW.duration_weeks = CEIL(
      (EXTRACT(EPOCH FROM (NEW.end_date::date - NEW.start_date::date)) / 86400 + 1) / 7
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_batch_insert_update ON public.batches;

-- Create trigger to automatically calculate duration
CREATE TRIGGER on_batch_insert_update
  BEFORE INSERT OR UPDATE ON public.batches
  FOR EACH ROW
  EXECUTE FUNCTION calculate_batch_duration();

-- Update existing batches to calculate duration
UPDATE public.batches
SET duration_weeks = CEIL(
  (EXTRACT(EPOCH FROM (end_date::date - start_date::date)) / 86400 + 1) / 7
)
WHERE duration_weeks = 0 AND start_date IS NOT NULL AND end_date IS NOT NULL;

-- Make the column NOT NULL after updating existing records
ALTER TABLE public.batches ALTER COLUMN duration_weeks SET NOT NULL;

-- Add a check constraint to ensure duration is positive
ALTER TABLE public.batches
ADD CONSTRAINT check_duration_weeks_positive
CHECK (duration_weeks >= 0);