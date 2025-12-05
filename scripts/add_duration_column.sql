-- Add duration_weeks column to batches table
-- Run this in Supabase SQL Editor

-- Add the column if it doesn't exist
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS duration_weeks INTEGER DEFAULT 0;

-- Optional: Add a comment to describe the column
COMMENT ON COLUMN public.batches.duration_weeks IS 'Duration of the batch in weeks';