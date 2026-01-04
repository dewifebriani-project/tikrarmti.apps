-- Migration: Make halaqah.program_id nullable to allow creating halaqah before assigning program
-- This supports the workflow where halaqah is created first, then program is assigned later by admin

-- Drop the NOT NULL constraint from program_id
ALTER TABLE public.halaqah ALTER COLUMN program_id DROP NOT NULL;

-- Add comment explaining the nullable program_id
COMMENT ON COLUMN public.halaqah.program_id IS 'Program ID - can be null initially, assigned by admin after halaqah creation';
