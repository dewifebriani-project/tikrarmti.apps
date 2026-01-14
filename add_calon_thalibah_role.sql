-- ============================================
-- FIX: Tambahkan role 'calon_thalibah' ke user yang:
-- 1. Sudah mendaftar tikrar (ada di pendaftaran_tikrar_tahfidz)
-- 2. Memiliki selection_status = 'selected'
-- 3. Belum memiliki role 'calon_thalibah'
-- ============================================

-- CEK DULU: Berapa banyak user yang terdampak
SELECT
  u.id,
  u.full_name,
  u.email,
  u.roles,
  pt.selection_status,
  pt.status as pendaftaran_status
FROM users u
JOIN pendaftaran_tikrar_tahfidz pt ON u.id = pt.user_id
WHERE pt.selection_status = 'selected'
  AND NOT ('calon_thalibah' = ANY(u.roles))
ORDER BY u.full_name;

-- ============================================
-- PERBAIKI: Tambahkan role 'calon_thalibah'
-- ============================================

-- Update untuk menambahkan role 'calon_thalibah' ke user yang sudah selected
-- Tapi HANYA jika belum punya role tersebut
UPDATE users u
SET roles = array_append(
    array_distinct(
      COALESCE(u.roles, ARRAY[]::text[]) || ARRAY['calon_thalibah']
    ),
    'calon_thalibah'
  ),
  updated_at = NOW()
FROM pendaftaran_tikrar_tahfidz pt
WHERE u.id = pt.user_id
  AND pt.selection_status = 'selected'
  AND NOT ('calon_thalibah' = ANY(u.roles));

-- ============================================
-- VERIFIKASI HASIL
-- ============================================

SELECT
  u.id,
  u.full_name,
  u.email,
  u.roles,
  -- Cek apakah sekarang punya role calon_thalibah
  CASE WHEN 'calon_thalibah' = ANY(u.roles) THEN 'YES' ELSE 'NO' END as has_calon_thalibah,
  pt.selection_status
FROM users u
JOIN pendaftaran_tikrar_tahfidz pt ON u.id = pt.user_id
WHERE u.full_name IN ('Dewi Nurhayati', 'Wahyu Suci Fatriyanti', 'Ira Mutmainah', 'Rina Mayang Sari')
ORDER BY u.full_name;

-- ============================================
-- QUERY UNTUK CEK USER YANG PERLU DIPERBAIKI
-- (Sebelum dijalankan, untuk review)
-- ============================================

-- User yang mendaftar tikrar tapi tidak punya role calon_thalibah
SELECT
  u.id,
  u.full_name,
  u.email,
  u.roles,
  pt.selection_status,
  pt.chosen_juz
FROM users u
JOIN pendaftaran_tikrar_tahfidz pt ON u.id = pt.user_id
WHERE pt.selection_status = 'selected'
  AND NOT ('calon_thalibah' = ANY(u.roles))
ORDER BY u.created_at DESC
LIMIT 50;
