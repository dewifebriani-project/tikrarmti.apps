-- =====================================================
-- EXPORT DATA - PROJECT LAMA
-- Jalankan di SQL Editor Project LAMA: nmbvklixthlqtkkgqnjl
-- Download hasil sebagai CSV untuk setiap query
-- =====================================================

-- 1. users (ORDER by created_at)
SELECT * FROM public.users ORDER BY created_at;

-- 2. batches (ORDER by created_at)
SELECT * FROM public.batches ORDER BY created_at;

-- 3. programs (ORDER by created_at)
SELECT * FROM public.programs ORDER BY created_at;

-- 4. juz_options (ORDER by sort_order)
SELECT * FROM public.juz_options ORDER BY sort_order;

-- 5. halaqah (ORDER by created_at)
SELECT * FROM public.halaqah ORDER BY created_at;

-- 6. halaqah_students (ORDER by assigned_at - bukan created_at!)
SELECT * FROM public.halaqah_students ORDER BY assigned_at;

-- 7. halaqah_mentors (ORDER by assigned_at)
SELECT * FROM public.halaqah_mentors ORDER BY assigned_at;

-- 8. pendaftaran_tikrar_tahfidz (ORDER by created_at)
SELECT * FROM public.pendaftaran_tikrar_tahfidz ORDER BY created_at;

-- 9. daftar_ulang_submissions (ORDER by created_at)
SELECT * FROM public.daftar_ulang_submissions ORDER BY created_at;

-- 10. jurnal_records (ORDER by created_at)
SELECT * FROM public.jurnal_records ORDER BY created_at;

-- 11. tashih_records (ORDER by created_at)
SELECT * FROM public.tashih_records ORDER BY created_at;

-- 12. muallimah_registrations (ORDER by created_at)
SELECT * FROM public.muallimah_registrations ORDER BY created_at;

-- 13. musyrifah_registrations (ORDER by created_at)
SELECT * FROM public.musyrifah_registrations ORDER BY created_at;

-- 14. exam_configurations (ORDER by created_at)
SELECT * FROM public.exam_configurations ORDER BY created_at;

-- 15. exam_questions (ORDER by created_at)
SELECT * FROM public.exam_questions ORDER BY created_at;

-- 16. exam_attempts (ORDER by created_at)
SELECT * FROM public.exam_attempts ORDER BY created_at;

-- =====================================================
-- IMPORT INSTRUCTIONS:
-- 1. Untuk setiap query di atas:
--    - Jalankan di SQL Editor Project LAMA
--    - Klik "Download" → pilih CSV
--    - Simpan dengan nama tabel (misal: users.csv)
--
-- 2. Di Project BARU:
--    - Buka Table Editor
--    - Pilih tabel yang bersangkutan
--    - Klik "Insert" → "Import from CSV"
--    - Upload file CSV
--
-- 3. ORDER IMPORT (penting untuk foreign keys):
--    1. users
--    2. batches
--    3. programs
--    4. juz_options
--    5. halaqah
--    6. halaqah_mentors
--    7. pendaftaran_tikrar_tahfidz
--    8. halaqah_students
--    9. daftar_ulang_submissions
--    10. jurnal_records
--    11. tashih_records
--    12. muallimah_registrations
--    13. musyrifah_registrations
--    14. exam_configurations
--    15. exam_questions
--    16. exam_attempts
-- =====================================================
