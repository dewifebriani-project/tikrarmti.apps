-- Add registered_count column to batches table
-- Run this in Supabase SQL Editor

-- Check if registered_count column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'batches' AND column_name = 'registered_count';

-- Add registered_count column if it doesn't exist
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS registered_count INTEGER DEFAULT 0;

-- Add comment to describe the column
COMMENT ON COLUMN public.batches.registered_count IS 'Number of registered users for this batch';

-- For now, set registered_count to 0 for existing batches
-- This will be updated automatically when users register
UPDATE public.batches
SET registered_count = 0
WHERE registered_count IS NULL;

-- Verify the changes
SELECT id, name, total_quota, registered_count, status FROM public.batches ORDER BY created_at DESC;