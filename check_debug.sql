-- ============================================
-- DEBUG: Cek data lengkap Wahyu Suci dan Dewi Nurhayati
-- ============================================

-- 0. Cek schema daftar_ulang_submissions
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'daftar_ulang_submissions'
ORDER BY ordinal_position;

-- 1. Cek roles mereka
SELECT
  u.id,
  u.full_name,
  u.email,
  u.roles,
  CASE WHEN 'calon_thalibah' = ANY(u.roles) THEN 'YES' ELSE 'NO' END as is_calon_thalibah,
  CASE WHEN 'thalibah' = ANY(u.roles) THEN 'YES' ELSE 'NO' END as is_thalibah,
  CASE WHEN 'admin' = ANY(u.roles) THEN 'YES' ELSE 'NO' END as is_admin,
  CASE WHEN 'muallimah' = ANY(u.roles) THEN 'YES' ELSE 'NO' END as is_muallimah
FROM users u
WHERE u.full_name IN ('Dewi Nurhayati', 'Wahyu Suci Fatriyanti')
ORDER BY u.full_name;

-- 2. Cek data pendaftaran tikrar
SELECT
  pt.id,
  pt.user_id,
  u.full_name,
  pt.selection_status,
  pt.chosen_juz,
  pt.status as pendaftaran_status,
  pt.re_enrollment_completed,
  pt.batch_id
FROM pendaftaran_tikrar_tahfidz pt
JOIN users u ON u.id = pt.user_id
WHERE u.full_name IN ('Dewi Nurhayati', 'Wahyu Suci Fatriyanti')
ORDER BY u.full_name;

-- 3. Cek data daftar ulang submissions (tanpa approved_at)
SELECT
  ds.id,
  ds.user_id,
  u.full_name,
  ds.status,
  ds.submitted_at,
  ds.updated_at,
  ds.ujian_halaqah_id,
  ds.tashih_halaqah_id,
  ds.batch_id,
  -- Cek apakah halaqah data ada
  (SELECT name FROM halaqah WHERE id = ds.ujian_halaqah_id) as ujian_halaqah_name,
  (SELECT name FROM halaqah WHERE id = ds.tashih_halaqah_id) as tashih_halaqah_name
FROM daftar_ulang_submissions ds
JOIN users u ON u.id = ds.user_id
WHERE u.full_name IN ('Dewi Nurhayati', 'Wahyu Suci Fatriyanti')
ORDER BY u.full_name;

-- 4. Cek semua batches untuk mencari yang aktif
SELECT id, name, status FROM batches ORDER BY created_at DESC LIMIT 5;

-- 5. Cek query yang sama dengan yang dipakai di frontend
SELECT
  ds.id,
  ds.user_id,
  ds.status,
  ds.submitted_at,
  ds.updated_at,
  ds.ujian_halaqah_id,
  ds.tashih_halaqah_id,
  ds.batch_id,
  u.full_name,
  u.roles
FROM daftar_ulang_submissions ds
JOIN users u ON u.id = ds.user_id
WHERE u.full_name IN ('Dewi Nurhayati', 'Wahyu Suci Fatriyanti')
ORDER BY u.full_name;
