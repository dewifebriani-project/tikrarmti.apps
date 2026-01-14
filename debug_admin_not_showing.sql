-- ============================================
-- DEBUG: Kenapa admin tidak muncul di per-halaqah
-- ============================================

-- 1. Cek data lengkap Dewi Nurhayati (admin)
SELECT
  'DEWI NURHAYATI' as user_name,
  u.id,
  u.full_name,
  u.email,
  u.roles,
  -- Cek role
  CASE WHEN 'calon_thalibah' = ANY(u.roles) THEN 'YES' ELSE 'NO' END as is_calon_thalibah,
  CASE WHEN 'thalibah' = ANY(u.roles) THEN 'YES' ELSE 'NO' END as is_thalibah,
  CASE WHEN 'admin' = ANY(u.roles) THEN 'YES' ELSE 'NO' END as is_admin
FROM users u
WHERE u.full_name = 'Dewi Nurhayati';

-- 2. Cek daftar ulang submission Dewi
SELECT
  ds.id,
  ds.user_id,
  ds.status,
  ds.batch_id,
  ds.ujian_halaqah_id,
  ds.tashih_halaqah_id,
  ds.submitted_at,
  ds.updated_at,
  -- Cek halaqah exists
  (SELECT id FROM halaqah WHERE id = ds.ujian_halaqah_id) as ujian_halaqah_exists,
  (SELECT name FROM halaqah WHERE id = ds.ujian_halaqah_id) as ujian_halaqah_name
FROM daftar_ulang_submissions ds
WHERE ds.user_id = (SELECT id FROM users WHERE full_name = 'Dewi Nurhayati')
  AND ds.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49';

-- 3. Cek pendaftaran tikrar Dewi
SELECT
  pt.id,
  pt.user_id,
  pt.selection_status,
  pt.status,
  pt.re_enrollment_completed,
  pt.batch_id
FROM pendaftaran_tikrar_tahfidz pt
WHERE pt.user_id = (SELECT id FROM users WHERE full_name = 'Dewi Nurhayati');

-- 4. Cek apa yang akan di-return API untuk Dewi
-- Simulasi query yang dipakai API
SELECT
  ds.id,
  ds.user_id,
  ds.status,
  ds.ujian_halaqah_id,
  ds.tashih_halaqah_id,
  u.full_name,
  u.roles,
  -- Join ke halaqah (sama seperti di API)
  h1.id as ujian_halaqah_obj_id,
  h1.name as ujian_halaqah_obj_name,
  h2.id as tashih_halaqah_obj_id,
  h2.name as tashih_halaqah_obj_name
FROM daftar_ulang_submissions ds
JOIN users u ON u.id = ds.user_id
LEFT JOIN halaqah h1 ON h1.id = ds.ujian_halaqah_id
LEFT JOIN halaqah h2 ON h2.id = ds.tashih_halaqah_id
WHERE ds.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49'
  AND u.full_name = 'Dewi Nurhayati';

-- 5. Bandingkan dengan thalibah yang MUNCUL (Ira Mutmainah)
SELECT
  'COMPARISON' as info,
  ds.id,
  ds.user_id,
  u.full_name,
  ds.status,
  u.roles,
  ds.ujian_halaqah_id,
  (SELECT id FROM halaqah WHERE id = ds.ujian_halaqah_id) as halaqah_exists
FROM daftar_ulang_submissions ds
JOIN users u ON u.id = ds.user_id
WHERE u.full_name IN ('Dewi Nurhayati', 'Ira Mutmainah')
ORDER BY u.full_name;
