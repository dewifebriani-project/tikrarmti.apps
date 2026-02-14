-- ============================================
-- Debug Jurnal Records - SQL Queries
-- ============================================
-- Jalankan query ini di Supabase SQL Editor
-- ============================================

-- 1. Cek total jurnal records
SELECT
  COUNT(*) as total_jurnal_records,
  COUNT(CASE WHEN blok IS NULL THEN 1 END) as records_with_null_blok,
  COUNT(CASE WHEN blok IS NOT NULL THEN 1 END) as records_with_blok
FROM jurnal_records;

-- 2. Cek distribusi blok per juz
SELECT
  juz_code,
  COUNT(*) as record_count,
  COUNT(DISTINCT user_id) as unique_users
FROM jurnal_records
WHERE blok IS NOT NULL
GROUP BY juz_code
ORDER BY juz_code;

-- 3. Cek format blok field
SELECT
  CASE
    WHEN blok IS NULL THEN 'NULL/Empty'
    WHEN blok::text LIKE '[%' THEN 'JSON Array String'
    WHEN blok::text LIKE 'H%' THEN 'Single String (HXX)'
    ELSE 'Other Format'
  END as blok_format,
  COUNT(*) as count
FROM jurnal_records
GROUP BY blok_format
ORDER BY count DESC;

-- 4. Cek unique blok values
SELECT
  blok,
  COUNT(*) as count,
  STRING_AGG(DISTINCT juz_code, ', ') as juz_codes
FROM jurnal_records
WHERE blok IS NOT NULL
GROUP BY blok
ORDER BY
  CASE
    WHEN blok ~ '^H\d+[A-D]$' THEN 0
    ELSE 1
  END,
  blok;

-- 5. Cek records dengan blok tidak valid (format HXX[A-D])
SELECT
  id,
  user_id,
  blok,
  juz_code,
  created_at
FROM jurnal_records
WHERE blok IS NOT NULL
  AND blok::text !~ '^H\d+[A-D](,|$|\[|\])'
LIMIT 20;

-- 6. Cek per user - berapa jurnal records dan blok apa saja
SELECT
  u.id as user_id,
  u.full_name,
  du.confirmed_chosen_juz,
  COUNT(jr.id) as jurnal_count,
  ARRAY_AGG(DISTINCT jr.blok) FILTER (WHERE jr.blok IS NOT NULL) as bloks
FROM daftar_ulang_submissions du
JOIN users u ON u.id = du.user_id
LEFT JOIN jurnal_records jr ON jr.user_id = du.user_id
WHERE du.status IN ('approved', 'submitted')
GROUP BY u.id, u.full_name, du.confirmed_chosen_juz
ORDER BY jurnal_count DESC, u.full_name;

-- 7. Cek distribusi pekan (week) dari blok codes
-- H1A-H1D = Week 1, H2A-H2D = Week 2, dst.
WITH jurnal_with_week AS (
  SELECT
    id,
    user_id,
    blok,
    juz_code,
    CASE
      WHEN blok ~ 'H(\d+)[A-D]' THEN
        CASE
          WHEN CAST(REGEXP_REPLACE(blok, 'H(\d+)[A-D]', '\1') AS INTEGER) BETWEEN 1 AND 10
            THEN CAST(REGEXP_REPLACE(blok, 'H(\d+)[A-D]', '\1') AS INTEGER)
          WHEN CAST(REGEXP_REPLACE(blok, 'H(\d+)[A-D]', '\1') AS INTEGER) BETWEEN 11 AND 20
            THEN CAST(REGEXP_REPLACE(blok, 'H(\d+)[A-D]', '\1') AS INTEGER) - 10
          ELSE NULL
        END
      ELSE NULL
    END as week_number
  FROM jurnal_records
  WHERE blok IS NOT NULL
)
SELECT
  week_number,
  COUNT(*) as record_count
FROM jurnal_with_week
WHERE week_number IS NOT NULL
GROUP BY week_number
ORDER BY week_number;

-- 8. Cek specific user - ganti USER_ID dengan ID yang ingin dicek
-- Uncomment dan jalankan untuk cek user spesifik:
/*
SELECT
  jr.id,
  jr.blok,
  jr.juz_code,
  jr.tanggal_setor,
  jr.created_at,
  CASE
    WHEN jr.blok ~ 'H(\d+)[A-D]' THEN
      CASE
        WHEN CAST(REGEXP_REPLACE(jr.blok, 'H(\d+)[A-D]', '\1') AS INTEGER) BETWEEN 1 AND 10
          THEN CAST(REGEXP_REPLACE(jr.blok, 'H(\d+)[A-D]', '\1') AS INTEGER)
        WHEN CAST(REGEXP_REPLACE(jr.blok, 'H(\d+)[A-D]', '\1') AS INTEGER) BETWEEN 11 AND 20
          THEN CAST(REGEXP_REPLACE(jr.blok, 'H(\d+)[A-D]', '\1') AS INTEGER) - 10
        ELSE NULL
      END
    ELSE NULL
  END as calculated_week
FROM jurnal_records jr
WHERE jr.user_id = 'USER_ID' -- Ganti dengan user ID yang dicek
ORDER BY jr.created_at DESC;
*/

-- 9. Cek apakah ada masalah dengan blok untuk juz 30
-- Expected blocks untuk 30A dan 30B
SELECT
  du.confirmed_chosen_juz,
  COUNT(DISTINCT jr.blok) as unique_bloks,
  ARRAY_AGG(DISTINCT jr.blok) FILTER (WHERE jr.blok IS NOT NULL) as all_bloks
FROM daftar_ulang_submissions du
LEFT JOIN jurnal_records jr ON jr.user_id = du.user_id
WHERE du.status IN ('approved', 'submitted')
  AND du.confirmed_chosen_juz IN ('30A', '30B')
GROUP BY du.confirmed_chosen_juz;

-- 10. Sample records dengan semua field untuk debugging
SELECT
  jr.*,
  u.full_name,
  u.nama_kunyah,
  du.confirmed_chosen_juz
FROM jurnal_records jr
JOIN users u ON u.id = jr.user_id
LEFT JOIN daftar_ulang_submissions du ON du.user_id = jr.user_id
ORDER BY jr.created_at DESC
LIMIT 10;
