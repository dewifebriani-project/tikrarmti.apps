-- Migration: Update muallimah_registrations table for complete registration form support
-- Date: 2025-12-23
-- Description: Add missing fields for the muallimah registration form

-- Enable extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add new fields that are NOT in the users table
ALTER TABLE muallimah_registrations
-- Education & Experience
ADD COLUMN IF NOT EXISTS tajweed_institution text,
ADD COLUMN IF NOT EXISTS quran_institution text,
ADD COLUMN IF NOT EXISTS teaching_communities text,
ADD COLUMN IF NOT EXISTS memorized_tajweed_matan text,
ADD COLUMN IF NOT EXISTS studied_matan_exegesis text,

-- Hafalan fields (stored as comma-separated values)
ADD COLUMN IF NOT EXISTS memorized_juz text,
ADD COLUMN IF NOT EXISTS examined_juz text,
ADD COLUMN IF NOT EXISTS certified_juz text,

-- Schedule preferences (stored as JSON)
ADD COLUMN IF NOT EXISTS preferred_schedule text,
ADD COLUMN IF NOT EXISTS backup_schedule text,

-- Paid class interest (stored as JSON)
ADD COLUMN IF NOT EXISTS paid_class_interest text,

-- Commitment
ADD COLUMN IF NOT EXISTS understands_commitment boolean DEFAULT false,

-- Age
ADD COLUMN IF NOT EXISTS age integer;

-- Add comments for documentation
COMMENT ON COLUMN muallimah_registrations.tajweed_institution IS 'Nama lembaga tempat belajar tajwid';
COMMENT ON COLUMN muallimah_registrations.quran_institution IS 'Nama lembaga tempat menghafal Al-Quran';
COMMENT ON COLUMN muallimah_registrations.teaching_communities IS 'Nama komunitas tempat mengajar saat ini (jika ada)';
COMMENT ON COLUMN muallimah_registrations.memorized_tajweed_matan IS 'Matan tajwid yang pernah dihafal (jika ada)';
COMMENT ON COLUMN muallimah_registrations.studied_matan_exegesis IS 'Syarah matan yang pernah dipelajari (jika ada)';
COMMENT ON COLUMN muallimah_registrations.memorized_juz IS 'Juz yang pernah dihafal (comma-separated, e.g., "1, 2, 30")';
COMMENT ON COLUMN muallimah_registrations.examined_juz IS 'Juz yang pernah diujikan (comma-separated)';
COMMENT ON COLUMN muallimah_registrations.certified_juz IS 'Juz yang pernah mendapat sertifikat (comma-separated)';
COMMENT ON COLUMN muallimah_registrations.preferred_schedule IS 'Jadwal utama mengajar (JSON: {"day": "senin", "time": "09:00", "formatted": "Senin, 09:00"})';
COMMENT ON COLUMN muallimah_registrations.backup_schedule IS 'Jadwal cadangan mengajar (JSON: {"day": "selasa", "time": "10:00", "formatted": "Selasa, 10:00"})';
COMMENT ON COLUMN muallimah_registrations.paid_class_interest IS 'Detail kelas berbayar (JSON: {"name": "Tahfidz Juz 30", "schedule": "Senin 19:00", "max_students": 10, "spp_percentage": "80", "additional_info": "..."})';
COMMENT ON COLUMN muallimah_registrations.understands_commitment IS 'Sudah faham dan setuju dengan komitmen program (gratis, 11 pekan, dll)';
COMMENT ON COLUMN muallimah_registrations.age IS 'Usia dalam tahun (dihitung dari tanggal_lahir)';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_muallimah_registrations_user_batch ON muallimah_registrations(user_id, batch_id);
CREATE INDEX IF NOT EXISTS idx_muallimah_registrations_status ON muallimah_registrations(status);
CREATE INDEX IF NOT EXISTS idx_muallimah_registrations_batch ON muallimah_registrations(batch_id);

-- Grant necessary permissions (adjust as needed based on RLS policies)
-- Note: These commands assume RLS is enabled. Adjust based on your security requirements.

-- Example: Allow authenticated users to read their own registrations
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM pg_policies
--     WHERE tablename = 'muallimah_registrations'
--     AND policyname = 'allow_users_read_own_registrations'
--   ) THEN
--     CREATE POLICY "allow_users_read_own_registrations"
--     ON muallimah_registrations
--     FOR SELECT
--     USING (auth.uid() = user_id);
--   END IF;
-- END $$;

-- Example: Allow authenticated users to insert their own registrations
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM pg_policies
--     WHERE tablename = 'muallimah_registrations'
--     AND policyname = 'allow_users_insert_own_registrations'
--   ) THEN
--     CREATE POLICY "allow_users_insert_own_registrations"
--     ON muallimah_registrations
--     FOR INSERT
--     WITH CHECK (auth.uid() = user_id);
--   END IF;
-- END $$;

-- Example: Allow authenticated users to update their own pending registrations
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM pg_policies
--     WHERE tablename = 'muallimah_registrations'
--     AND policyname = 'allow_users_update_own_pending_registrations'
--   ) THEN
--     CREATE POLICY "allow_users_update_own_pending_registrations"
--     ON muallimah_registrations
--     FOR UPDATE
--     USING (
--       auth.uid() = user_id
--       AND status IN ('pending', 'review')
--     )
--     WITH CHECK (
--       auth.uid() = user_id
--       AND status IN ('pending', 'review')
--     );
--   END IF;
-- END $$;
