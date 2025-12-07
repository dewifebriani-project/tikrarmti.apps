-- =====================================================
-- Fix ready_for_team constraint to include 'infaq' option
-- =====================================================
-- This script updates the CHECK constraint on pendaftaran_tikrar_tahfidz table
-- to allow 'infaq' as a valid value for ready_for_team field

-- First, drop the existing constraint if it exists
ALTER TABLE pendaftaran_tikrar_tahfidz DROP CONSTRAINT IF EXISTS pendaftaran_tikrar_tahfidz_ready_for_team_check;

-- Add the updated constraint with 'infaq' option
ALTER TABLE pendaftaran_tikrar_tahfidz
ADD CONSTRAINT pendaftaran_tikrar_tahfidz_ready_for_team_check
CHECK (ready_for_team IN ('ready', 'not_ready', 'considering', 'infaq'));

-- Verify the constraint was added
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'pendaftaran_tikrar_tahfidz'::regclass
AND conname = 'pendaftaran_tikrar_tahfidz_ready_for_team_check';