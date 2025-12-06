-- Add price-related fields to batches table
-- This migration adds is_free, price, and total_quota columns

-- Step 1: Add is_free column (default TRUE for free programs)
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT TRUE;

-- Step 2: Add price column (default 0 for free programs)
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0;

-- Step 3: Add total_quota column for maximum participants
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS total_quota INTEGER DEFAULT 100;

-- Step 4: Update existing batch to be free with 100 quota
UPDATE public.batches
SET
  is_free = TRUE,
  price = 0,
  total_quota = 100
WHERE name = 'Tikrar MTI Batch 2';

-- Step 5: Verify the update
SELECT
  id,
  name,
  is_free,
  price,
  total_quota,
  start_date,
  end_date,
  status
FROM public.batches
WHERE name = 'Tikrar MTI Batch 2';
