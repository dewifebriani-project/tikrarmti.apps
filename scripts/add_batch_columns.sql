-- Add missing columns to batches table
-- Run this in Supabase SQL Editor

-- Add is_free column (default: true for free programs)
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS is_free boolean DEFAULT true;

-- Add price column (default: 0 for free programs)
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS price numeric(10,2) DEFAULT 0;

-- Add total_quota column (default: 100 participants)
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS total_quota integer DEFAULT 100;

-- Add constraint to ensure total_quota is positive
ALTER TABLE public.batches
ADD CONSTRAINT IF NOT EXISTS check_total_quota_positive
CHECK (total_quota > 0);

-- Add constraint to ensure price is non-negative
ALTER TABLE public.batches
ADD CONSTRAINT IF NOT EXISTS check_price_non_negative
CHECK (price >= 0);

-- Comment on new columns
COMMENT ON COLUMN public.batches.is_free IS 'Whether the program is free or paid';
COMMENT ON COLUMN public.batches.price IS 'Price of the program (0 if free)';
COMMENT ON COLUMN public.batches.total_quota IS 'Total number of participants allowed';
