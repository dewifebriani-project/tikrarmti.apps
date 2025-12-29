-- Add registered_count column to batches table
-- This column tracks the number of registered users for each batch

ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS registered_count integer DEFAULT 0;

-- Add comment
COMMENT ON COLUMN public.batches.registered_count IS 'Number of users registered in this batch';
