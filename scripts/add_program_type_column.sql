-- Add program_type column to batches table
-- Run this in Supabase SQL Editor

-- Check if program_type column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'batches' AND column_name = 'program_type';

-- Add program_type column if it doesn't exist
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS program_type VARCHAR(50) DEFAULT NULL;

-- Add comment to describe the column
COMMENT ON COLUMN public.batches.program_type IS 'Type of program: tikrar_tahfidz, halaqah, etc.';

-- Update existing batches to have program_type if they have Tikrar in the name
UPDATE public.batches
SET program_type = 'tikrar_tahfidz'
WHERE program_type IS NULL
AND (name ILIKE '%tikrar%' OR name ILIKE '%MTI%')
AND status = 'open';

-- Verify the changes
SELECT id, name, program_type, status FROM public.batches ORDER BY created_at DESC;