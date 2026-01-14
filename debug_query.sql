-- Query untuk memeriksa data enrolment dan daftar_ulang_submissions
-- untuk thalibah yang bermasalah: Dewi Nurhayati dan Wahyu Suci Fatriyanti
-- dibandingkan dengan yang berfungsi: Ira Mutmainah dan Rina Mayang Sari

-- ============================================
-- 1. CEK DATA ENROLMENT (pendaftaran_tikrar_tahfidz)
-- ============================================

SELECT
  id,
  user_id,
  full_name,
  status,
  selection_status,
  re_enrollment_completed,
  chosen_juz,
  batch_id,
  created_at
FROM pendaftaran_tikrar_tahfidz
WHERE full_name IN (
  'Dewi Nurhayati',
  'Wahyu Suci Fatriyanti',
  'Ira Mutmainah',
  'Rina Mayang Sari'
)
ORDER BY full_name;

-- ============================================
-- 2. CEK DATA DAFTAR ULANG SUBMISSIONS
-- ============================================

SELECT
  ds.id,
  ds.user_id,
  ds.batch_id,
  ds.status,
  ds.submitted_at,
  ds.created_at,
  ds.ujian_halaqah_id,
  ds.tashih_halaqah_id,
  ds.is_tashih_umum,
  u.full_name as thalibah_name,
  -- Cek apakah halaqah ada
  (SELECT id FROM halaqah WHERE id = ds.ujian_halaqah_id) as ujian_halaqah_exists,
  (SELECT id FROM halaqah WHERE id = ds.tashih_halaqah_id) as tashih_halaqah_exists
FROM daftar_ulang_submissions ds
JOIN users u ON ds.user_id = u.id
WHERE u.full_name IN (
  'Dewi Nurhayati',
  'Wahyu Suci Fatriyanti',
  'Ira Mutmainah',
  'Rina Mayang Sari'
)
ORDER BY u.full_name, ds.created_at DESC;

-- ============================================
-- 3. CEK DETAIL HALAQAH YANG DI-ASSIGN
-- ============================================

SELECT
  ds.id as submission_id,
  u.full_name as thalibah_name,
  ds.status as submission_status,
  ds.ujian_halaqah_id,
  uj.name as ujian_halaqah_name,
  uj.muallimah_id as ujian_muallimah_id,
  uj_muallimah.full_name as ujian_muallimah_name,
  ds.tashih_halaqah_id,
  ts.name as tashih_halaqah_name,
  ts.muallimah_id as tashih_muallimah_id,
  ts_muallimah.full_name as tashih_muallimah_name
FROM daftar_ulang_submissions ds
JOIN users u ON ds.user_id = u.id
LEFT JOIN halaqah uj ON ds.ujian_halaqah_id = uj.id
LEFT JOIN users uj_muallimah ON uj.muallimah_id = uj_muallimah.id
LEFT JOIN halaqah ts ON ds.tashih_halaqah_id = ts.id
LEFT JOIN users ts_muallimah ON ts.muallimah_id = ts_muallimah.id
WHERE u.full_name IN (
  'Dewi Nurhayati',
  'Wahyu Suci Fatriyanti',
  'Ira Mutmainah',
  'Rina Mayang Sari'
)
ORDER BY u.full_name;

-- ============================================
-- 4. CEK BATCH ID YANG DIGUNAKAN
-- ============================================

SELECT
  ds.id as submission_id,
  u.full_name as thalibah_name,
  ds.batch_id as submission_batch_id,
  pe.batch_id as enrolment_batch_id,
  ds.status,
  ds.ujian_halaqah_id,
  ds.tashih_halaqah_id,
  -- Cek apakah batch_id cocok
  CASE
    WHEN ds.batch_id = pe.batch_id THEN 'MATCH'
    ELSE 'MISMATCH'
  END as batch_match
FROM daftar_ulang_submissions ds
JOIN users u ON ds.user_id = u.id
LEFT JOIN pendaftaran_tikrar_tahfidz pe ON ds.registration_id = pe.id
WHERE u.full_name IN (
  'Dewi Nurhayati',
  'Wahyu Suci Fatriyanti',
  'Ira Mutmainah',
  'Rina Mayang Sari'
)
ORDER BY u.full_name;

-- ============================================
-- 5. CEK USER IDs
-- ============================================

SELECT
  id,
  full_name,
  email,
  role,
  created_at
FROM users
WHERE full_name IN (
  'Dewi Nurhayati',
  'Wahyu Suci Fatriyanti',
  'Ira Mutmainah',
  'Rina Mayang Sari'
)
ORDER BY full_name;
