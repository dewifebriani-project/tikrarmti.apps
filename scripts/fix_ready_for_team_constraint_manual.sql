-- =====================================================
-- MANUAL FIX FOR ready_for_team constraint violation
-- =====================================================
--
-- PROBLEM:
-- The form is sending value 'infaq' for ready_for_team field
-- but the database constraint only accepts: 'ready', 'not_ready', 'considering'
--
-- SOLUTION:
-- Run this SQL script in your Supabase SQL Editor to fix the constraint
--
-- STEPS:
-- 1. Go to Supabase Dashboard -> SQL Editor
-- 2. Paste and run this script
-- =====================================================

-- First check if constraint exists
SELECT conname, conrelid::regclass AS table_name
FROM pg_constraint
WHERE conrelid = 'pendaftaran_tikrar_tahfidz'::regclass
AND conname = 'pendaftaran_tikrar_tahfidz_ready_for_team_check';

-- Drop the existing constraint if it exists
ALTER TABLE pendaftaran_tikrar_tahfidz DROP CONSTRAINT IF EXISTS pendaftaran_tikrar_tahfidz_ready_for_team_check;

-- Add the updated constraint with 'infaq' option
ALTER TABLE pendaftaran_tikrar_tahfidz
ADD CONSTRAINT pendaftaran_tikrar_tahfidz_ready_for_team_check
CHECK (ready_for_team IN ('ready', 'not_ready', 'considering', 'infaq'));

-- Verify the constraint was updated correctly
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'pendaftaran_tikrar_tahfidz'::regclass
AND conname = 'pendaftaran_tikrar_tahfidz_ready_for_team_check';