-- Add new fields to muallimah_registrations table based on Google Form requirements
-- These are fields NOT already in the users table (from register form)
ALTER TABLE muallimah_registrations
ADD COLUMN IF NOT EXISTS tajweed_institution text,
ADD COLUMN IF NOT EXISTS quran_institution text,
ADD COLUMN IF NOT EXISTS teaching_communities text, -- Komunitas tempat mengajar sekarang
ADD COLUMN IF NOT EXISTS memorized_tajweed_matan text, -- Matan tajwid yang pernah dihafal
ADD COLUMN IF NOT EXISTS studied_matan_exegesis text, -- Syarah matan yang dipelajari
ADD COLUMN IF NOT EXISTS examined_juz text, -- Juz yang pernah diujikan
ADD COLUMN IF NOT EXISTS certified_juz text, -- Juz yang pernah mendapat sertifikat
ADD COLUMN IF NOT EXISTS paid_class_interest text, -- Detail kelas berbayar: nama, jadwal, kuota, tarif
ADD COLUMN IF NOT EXISTS understands_commitment boolean DEFAULT false, -- Pemahaman komitmen program
ADD COLUMN IF NOT EXISTS age integer; -- Usia (dihitung dari tanggal_lahir)

-- Comments for documentation
COMMENT ON COLUMN muallimah_registrations.tajweed_institution IS 'Nama lembaga tempat belajar tajwid';
COMMENT ON COLUMN muallimah_registrations.quran_institution IS 'Nama lembaga tempat menghafal Al-Quran';
COMMENT ON COLUMN muallimah_registrations.teaching_communities IS 'Nama komunitas tempat mengajar saat ini (jika ada)';
COMMENT ON COLUMN muallimah_registrations.memorized_tajweed_matan IS 'Matan tajwid yang pernah dihafal (jika ada)';
COMMENT ON COLUMN muallimahah_registrations.studied_matan_exegesis IS 'Syarah matan yang pernah dipelajari (jika ada)';
COMMENT ON COLUMN muallimah_registrations.examined_juz IS 'Juz yang pernah diujikan (pisahkan dengan koma)';
COMMENT ON COLUMN muallimah_registrations.certified_juz IS 'Juz yang pernah mendapat sertifikat (pisahkan dengan koma)';
COMMENT ON COLUMN muallimah_registrations.paid_class_interest IS 'Detail kelas berbayar yang ingin dibuka: nama kelas, jadwal, kuota maksimal, tarif SPP';
COMMENT ON COLUMN muallimah_registrations.understands_commitment IS 'Sudah faham dan setuju dengan komitmen program (gratis, 11 pekan, dll)';
COMMENT ON COLUMN muallimah_registrations.age IS 'Usia dalam tahun (dihitung dari tanggal_lahir)';
