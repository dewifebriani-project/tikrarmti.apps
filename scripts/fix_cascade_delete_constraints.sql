-- FIX CASCADE DELETE CONSTRAINTS
-- This script changes ON DELETE CASCADE to ON DELETE RESTRICT
-- to prevent accidental data loss

-- IMPORTANT: Run this in Supabase SQL Editor

BEGIN;

-- ====================================
-- FIX pendaftaran_tikrar_tahfidz TABLE
-- ====================================

-- Drop existing foreign key constraints
ALTER TABLE IF EXISTS pendaftaran_tikrar_tahfidz
  DROP CONSTRAINT IF EXISTS pendaftaran_tikrar_tahfidz_batch_id_fkey;

ALTER TABLE IF EXISTS pendaftaran_tikrar_tahfidz
  DROP CONSTRAINT IF EXISTS pendaftaran_tikrar_tahfidz_program_id_fkey;

ALTER TABLE IF EXISTS pendaftaran_tikrar_tahfidz
  DROP CONSTRAINT IF EXISTS pendaftaran_tikrar_tahfidz_user_id_fkey;

-- Add foreign key constraints with RESTRICT (prevents deletion if data exists)
ALTER TABLE pendaftaran_tikrar_tahfidz
  ADD CONSTRAINT pendaftaran_tikrar_tahfidz_batch_id_fkey
  FOREIGN KEY (batch_id) REFERENCES batches (id) ON DELETE RESTRICT;

ALTER TABLE pendaftaran_tikrar_tahfidz
  ADD CONSTRAINT pendaftaran_tikrar_tahfidz_program_id_fkey
  FOREIGN KEY (program_id) REFERENCES programs (id) ON DELETE RESTRICT;

ALTER TABLE pendaftaran_tikrar_tahfidz
  ADD CONSTRAINT pendaftaran_tikrar_tahfidz_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT;

-- ====================================
-- FIX pendaftaran TABLE (if exists)
-- ====================================

ALTER TABLE IF EXISTS pendaftaran
  DROP CONSTRAINT IF EXISTS pendaftaran_batch_id_fkey;

ALTER TABLE IF EXISTS pendaftaran
  DROP CONSTRAINT IF EXISTS pendaftaran_program_id_fkey;

ALTER TABLE IF EXISTS pendaftaran
  DROP CONSTRAINT IF EXISTS pendaftaran_thalibah_id_fkey;

ALTER TABLE IF EXISTS pendaftaran
  ADD CONSTRAINT pendaftaran_batch_id_fkey
  FOREIGN KEY (batch_id) REFERENCES batches (id) ON DELETE RESTRICT;

ALTER TABLE IF EXISTS pendaftaran
  ADD CONSTRAINT pendaftaran_program_id_fkey
  FOREIGN KEY (program_id) REFERENCES programs (id) ON DELETE RESTRICT;

ALTER TABLE IF EXISTS pendaftaran
  ADD CONSTRAINT pendaftaran_thalibah_id_fkey
  FOREIGN KEY (thalibah_id) REFERENCES users (id) ON DELETE RESTRICT;

-- ====================================
-- FIX programs TABLE
-- ====================================

ALTER TABLE IF EXISTS programs
  DROP CONSTRAINT IF EXISTS programs_batch_id_fkey;

ALTER TABLE IF EXISTS programs
  ADD CONSTRAINT programs_batch_id_fkey
  FOREIGN KEY (batch_id) REFERENCES batches (id) ON DELETE RESTRICT;

-- ====================================
-- FIX halaqah TABLE
-- ====================================

ALTER TABLE IF EXISTS halaqah
  DROP CONSTRAINT IF EXISTS halaqah_program_id_fkey;

ALTER TABLE IF EXISTS halaqah
  ADD CONSTRAINT halaqah_program_id_fkey
  FOREIGN KEY (program_id) REFERENCES programs (id) ON DELETE RESTRICT;

-- ====================================
-- FIX halaqah_mentors TABLE
-- ====================================

ALTER TABLE IF EXISTS halaqah_mentors
  DROP CONSTRAINT IF EXISTS halaqah_mentors_halaqah_id_fkey;

ALTER TABLE IF EXISTS halaqah_mentors
  DROP CONSTRAINT IF EXISTS halaqah_mentors_mentor_id_fkey;

ALTER TABLE IF EXISTS halaqah_mentors
  ADD CONSTRAINT halaqah_mentors_halaqah_id_fkey
  FOREIGN KEY (halaqah_id) REFERENCES halaqah (id) ON DELETE RESTRICT;

ALTER TABLE IF EXISTS halaqah_mentors
  ADD CONSTRAINT halaqah_mentors_mentor_id_fkey
  FOREIGN KEY (mentor_id) REFERENCES users (id) ON DELETE RESTRICT;

-- ====================================
-- FIX halaqah_students TABLE
-- ====================================

ALTER TABLE IF EXISTS halaqah_students
  DROP CONSTRAINT IF EXISTS halaqah_students_halaqah_id_fkey;

ALTER TABLE IF EXISTS halaqah_students
  DROP CONSTRAINT IF EXISTS halaqah_students_thalibah_id_fkey;

ALTER TABLE IF EXISTS halaqah_students
  ADD CONSTRAINT halaqah_students_halaqah_id_fkey
  FOREIGN KEY (halaqah_id) REFERENCES halaqah (id) ON DELETE RESTRICT;

ALTER TABLE IF EXISTS halaqah_students
  ADD CONSTRAINT halaqah_students_thalibah_id_fkey
  FOREIGN KEY (thalibah_id) REFERENCES users (id) ON DELETE RESTRICT;

COMMIT;

-- Verify the changes
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('pendaftaran_tikrar_tahfidz', 'pendaftaran', 'programs', 'halaqah', 'halaqah_mentors', 'halaqah_students')
ORDER BY tc.table_name, kcu.column_name;
