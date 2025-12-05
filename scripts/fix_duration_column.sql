-- Fixed script to add duration_weeks column
-- Run this in Supabase SQL Editor

-- Add the column if it doesn't exist
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS duration_weeks INTEGER DEFAULT 0;

-- Update existing batches with simple calculation
UPDATE public.batches
SET duration_weeks = CASE
    WHEN start_date IS NOT NULL AND end_date IS NOT NULL
    THEN GREATEST(1, CEIL((end_date - start_date) / 7))
    ELSE 0
END
WHERE duration_weeks = 0;

-- Make column NOT NULL if you want
ALTER TABLE public.batches ALTER COLUMN duration_weeks SET NOT NULL;

-- Add check constraint
ALTER TABLE public.batches
ADD CONSTRAINT IF NOT EXISTS check_duration_weeks_positive
CHECK (duration_weeks >= 0);