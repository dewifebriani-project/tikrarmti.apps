-- Fix ready_for_team constraint to include 'infaq' option
-- This is needed because the form sends 'infaq' as a valid value

-- First, drop the existing constraint if it exists
ALTER TABLE pendaftaran_tikrar_tahfidz DROP CONSTRAINT IF EXISTS pendaftaran_tikrar_tahfidz_ready_for_team_check;

-- Add the updated constraint with 'infaq' option
ALTER TABLE pendaftaran_tikrar_tahfidz
ADD CONSTRAINT pendaftaran_tikrar_tahfidz_ready_for_team_check
CHECK (ready_for_team IN ('ready', 'not_ready', 'considering', 'infaq'));