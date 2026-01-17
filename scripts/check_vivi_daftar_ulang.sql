-- Query untuk mengecek data daftar_ulang untuk user vivinurvina@gmail.com
-- Jalankan di Supabase SQL Editor

-- 1. Cek user ID dari email
SELECT id, email, full_name, roles
FROM users
WHERE email = 'vivinurvina@gmail.com';

-- 2. Cek pendaftaran_tikrar_tahfidz untuk user ini (ambil ID lengkap)
SELECT id, user_id, full_name, selection_status, status, batch_id, created_at
FROM pendaftaran_tikrar_tahfidz
WHERE user_id = '902b0145-14b1-4d18-9553-0cf7372112bf'
ORDER BY created_at DESC;

-- 3. Cek daftar_ulang_submissions untuk user ini (lihat registration_id)
SELECT
  id,
  user_id,
  registration_id,
  status,
  batch_id,
  created_at,
  submitted_at
FROM daftar_ulang_submissions
WHERE user_id = '902b0145-14b1-4d18-9553-0cf7372112bf'
ORDER BY created_at DESC;

-- 4. Cek apakah registration_id di daftar_ulang_submissions COCOK dengan id di pendaftaran_tikrar_tahfidz
SELECT
  dus.id as submission_id,
  dus.registration_id as dus_registration_id,
  pt.id as pt_id,
  dus.status,
  CASE
    WHEN dus.registration_id = pt.id THEN 'MATCH ✓'
    ELSE 'MISMATCH ✗'
  END as match_status
FROM daftar_ulang_submissions dus
CROSS JOIN pendaftaran_tikrar_tahfidz pt
WHERE dus.user_id = '902b0145-14b1-4d18-9553-0cf7372112bf'
  AND pt.user_id = '902b0145-14b1-4d18-9553-0cf7372112bf'
ORDER BY dus.created_at DESC;
