-- ============================================
-- FIX ROLE UNTUK SEMUA USER
-- Berlaku untuk:
-- 1. User yang mendaftar tikrar (calon_thalibah) tapi belum punya role calon_thalibah
-- 2. Admin/muallimah yang seharusnya juga punya role calon_thalibah
-- 3. User yang daftar ulang approved tapi belum punya role thalibah
-- ============================================

-- ============================================
-- CEK 1: User yang mendaftar tikrar tapi tidak punya role calon_thalibah
-- ============================================

SELECT
  'User mendaftar tikrar tanpa role calon_thalibah' as issue,
  COUNT(*) as affected_users
FROM users u
JOIN pendaftaran_tikrar_tahfidz pt ON u.id = pt.user_id
WHERE pt.selection_status = 'selected'
  AND NOT ('calon_thalibah' = ANY(u.roles));

-- ============================================
-- FIX 1: Tambahkan role calon_thalibah ke user yang mendaftar tikrar
-- ============================================

UPDATE users u
SET roles = ARRAY(
    SELECT DISTINCT unnest(
      COALESCE(u.roles, ARRAY[]::text[]) || ARRAY['calon_thalibah']
    )
  ),
  updated_at = NOW()
FROM pendaftaran_tikrar_tahfidz pt
WHERE u.id = pt.user_id
  AND pt.selection_status = 'selected'
  AND NOT ('calon_thalibah' = ANY(u.roles));

-- ============================================
-- CEK 2: Admin/muallimah yang mendaftar tikrar sebagai calon_thalibah
--    tapi role mereka tidak mencerminkan itu
-- ============================================

SELECT
  'Admin/muallimah yang mendaftar tikrar' as issue,
  u.id,
  u.full_name,
  u.email,
  u.roles,
  pt.selection_status,
  pt.chosen_juz
FROM users u
JOIN pendaftaran_tikrar_tahfidz pt ON u.id = pt.user_id
WHERE pt.selection_status = 'selected'
  AND (
    -- Admin yang mendaftar tapi tidak punya role calon_thalibah
    ('admin' = ANY(u.roles) AND NOT ('calon_thalibah' = ANY(u.roles))) OR
    -- Muallimah yang mendaftar tapi tidak punya role calon_thalibah
    ('muallimah' = ANY(u.roles) AND NOT ('calon_thalibah' = ANY(u.roles)))
  )
ORDER BY u.full_name;

-- ============================================
-- FIX 2: Pastikan admin/muallimah yang mendaftar tikrar punya role calon_thalibah
-- (Sudah tercover di FIX 1, tapi ini untuk double-check)
-- ============================================

-- Role akan ditambahkan oleh query FIX 1 di atas

-- ============================================
-- CEK 3: User yang daftar ulang approved tapi belum punya role thalibah
-- ============================================

SELECT
  'Approved daftar ulang tanpa role thalibah' as issue,
  COUNT(*) as affected_users
FROM users u
JOIN daftar_ulang_submissions ds ON u.id = ds.user_id
WHERE ds.status = 'approved'
  AND NOT ('thalibah' = ANY(u.roles));

-- ============================================
-- FIX 3: Tambahkan role thalibah ke user yang daftar ulang approved
-- ============================================

UPDATE users u
SET roles = ARRAY(
    SELECT DISTINCT unnest(
      COALESCE(u.roles, ARRAY[]::text[]) || ARRAY['thalibah']
    )
  ),
  updated_at = NOW()
FROM daftar_ulang_submissions ds
WHERE u.id = ds.user_id
  AND ds.status = 'approved'
  AND NOT ('thalibah' = ANY(u.roles));

-- ============================================
-- VERIFIKASI HASIL
-- ============================================

SELECT
  u.id,
  u.full_name,
  u.email,
  u.roles,
  -- Cek roles
  CASE WHEN 'calon_thalibah' = ANY(u.roles) THEN 'YES' ELSE 'NO' END as is_calon_thalibah,
  CASE WHEN 'thalibah' = ANY(u.roles) THEN 'YES' ELSE 'NO' END as is_thalibah,
  CASE WHEN 'admin' = ANY(u.roles) THEN 'YES' ELSE 'NO' END as is_admin,
  CASE WHEN 'muallimah' = ANY(u.roles) THEN 'YES' ELSE 'NO' END as is_muallimah,
  -- Info pendaftaran
  pt.selection_status,
  pt.chosen_juz,
  -- Info daftar ulang
  ds.status as daftar_ulang_status,
  ds.ujian_halaqah_id,
  ds.tashih_halaqah_id
FROM users u
LEFT JOIN pendaftaran_tikrar_tahfidz pt ON u.id = pt.user_id
LEFT JOIN daftar_ulang_submissions ds ON u.id = ds.user_id AND ds.batch_id = pt.batch_id
WHERE u.full_name IN (
  'Dewi Nurhayati',
  'Wahyu Suci Fatriyanti',
  'Ira Mutmainah',
  'Rina Mayang Sari'
)
ORDER BY u.full_name;

-- ============================================
-- SUMMARY: Berapa banyak user yang diperbaiki
-- ============================================

SELECT
  'Total user dengan role calon_thalibah' as description,
  COUNT(*) as count
FROM users
WHERE 'calon_thalibah' = ANY(roles)

UNION ALL

SELECT
  'Total user dengan role thalibah' as description,
  COUNT(*) as count
FROM users
WHERE 'thalibah' = ANY(roles)

UNION ALL

SELECT
  'Total user multi-role (admin + calon_thalibah)' as description,
  COUNT(*) as count
FROM users
WHERE 'admin' = ANY(roles) AND 'calon_thalibah' = ANY(roles)

UNION ALL

SELECT
  'Total user multi-role (muallimah + calon_thalibah)' as description,
  COUNT(*) as count
FROM users
WHERE 'muallimah' = ANY(roles) AND 'calon_thalibah' = ANY(roles);
