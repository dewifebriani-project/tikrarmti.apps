-- ============================================
-- Cek Jurnal P1-P4 untuk 5 Users Spesifik
-- ============================================
-- Jalankan query ini di Supabase SQL Editor
-- ============================================

-- 1. Cek user ID dan juz untuk 5 users
SELECT
  u.id as user_id,
  u.full_name,
  u.nama_kunyah,
  du.confirmed_chosen_juz,
  du.status as daftar_ulang_status
FROM users u
LEFT JOIN daftar_ulang_submissions du ON du.user_id = u.id
WHERE u.full_name ILIKE ANY(ARRAY[
  '%Aam%Ummu Rifki%',
  '%Afiek%Noer%Arifah%',
  '%Afifah%nur%sholeha%',
  '%Afifah%',
  '%Agustinaeliyanti%'
])
ORDER BY u.full_name;

-- ============================================
-- 2. Cek jurnal records per user dengan detail blok dan pekan
-- ============================================

WITH user_list AS (
  SELECT id, full_name
  FROM users
  WHERE full_name ILIKE ANY(ARRAY[
    '%Aam%Ummu Rifki%',
    '%Afiek%Noer%Arifah%',
    '%Afifah%nur%sholeha%',
    '%Afifah%',
    '%Agustinaeliyanti%'
  ])
),
jurnal_with_week AS (
  SELECT
    jr.id,
    jr.user_id,
    jr.blok,
    jr.tanggal_setor,
    jr.created_at,
    -- Calculate week from blok code
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
    END as week_number
  FROM jurnal_records jr
  WHERE jr.user_id IN (SELECT id FROM user_list)
),
weekly_status AS (
  SELECT
    u.id as user_id,
    u.full_name,
    du.confirmed_chosen_juz,
    juz.part,
    w.week as week_number,
    -- Count unique blocks per week
    COUNT(DISTINCT jw.blok) as blocks_completed,
    -- Expected blocks per week (always 4)
    4 as total_blocks_per_week,
    -- List all blocks for this week
    ARRAY_AGG(DISTINCT jw.blok) FILTER (WHERE jw.blok IS NOT NULL) as blocks
  FROM user_list u
  CROSS JOIN (SELECT 1 as week UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
              UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8
              UNION SELECT 9 UNION SELECT 10) w
  LEFT JOIN daftar_ulang_submissions du ON du.user_id = u.id
  LEFT JOIN juz_options juz ON juz.code = du.confirmed_chosen_juz
  LEFT JOIN jurnal_with_week jw ON jw.user_id = u.id AND jw.week_number = w.week
  GROUP BY u.id, u.full_name, du.confirmed_chosen_juz, juz.part, w.week
)
-- Final result: P1-P4 for each user
SELECT
  full_name as Nama,
  confirmed_chosen_juz as Juz,
  part as Part,
  -- P1
  CASE
    WHEN (SELECT blocks_completed FROM weekly_status WHERE user_id = ws.user_id AND week_number = 1) = 0 THEN '0/4'
    WHEN (SELECT blocks_completed FROM weekly_status WHERE user_id = ws.user_id AND week_number = 1) = 4 THEN '✓'
    ELSE (SELECT blocks_completed FROM weekly_status WHERE user_id = ws.user_id AND week_number = 1) || '/4'
  END as P1,
  -- P2
  CASE
    WHEN (SELECT blocks_completed FROM weekly_status WHERE user_id = ws.user_id AND week_number = 2) = 0 THEN '0/4'
    WHEN (SELECT blocks_completed FROM weekly_status WHERE user_id = ws.user_id AND week_number = 2) = 4 THEN '✓'
    ELSE (SELECT blocks_completed FROM weekly_status WHERE user_id = ws.user_id AND week_number = 2) || '/4'
  END as P2,
  -- P3
  CASE
    WHEN (SELECT blocks_completed FROM weekly_status WHERE user_id = ws.user_id AND week_number = 3) = 0 THEN '0/4'
    WHEN (SELECT blocks_completed FROM weekly_status WHERE user_id = ws.user_id AND week_number = 3) = 4 THEN '✓'
    ELSE (SELECT blocks_completed FROM weekly_status WHERE user_id = ws.user_id AND week_number = 3) || '/4'
  END as P3,
  -- P4
  CASE
    WHEN (SELECT blocks_completed FROM weekly_status WHERE user_id = ws.user_id AND week_number = 4) = 0 THEN '0/4'
    WHEN (SELECT blocks_completed FROM weekly_status WHERE user_id = ws.user_id AND week_number = 4) = 4 THEN '✓'
    ELSE (SELECT blocks_completed FROM weekly_status WHERE user_id = ws.user_id AND week_number = 4) || '/4'
  END as P4,
  -- Total jurnal records
  (SELECT COUNT(*) FROM jurnal_records WHERE user_id = ws.user_id) as Total_Records
FROM weekly_status ws
WHERE week_number = 1  -- Just to get one row per user
GROUP BY ws.user_id, full_name, confirmed_chosen_juz, part
ORDER BY full_name;

-- ============================================
-- 3. Detail: Blok apa saja yang sudah diisi per pekan (P1-P4)
-- ============================================

WITH user_list AS (
  SELECT id, full_name
  FROM users
  WHERE full_name ILIKE ANY(ARRAY[
    '%Aam%Ummu Rifki%',
    '%Afiek%Noer%Arifah%',
    '%Afifah%nur%sholeha%',
    '%Afifah%',
    '%Agustinaeliyanti%'
  ])
),
jurnal_with_week AS (
  SELECT
    jr.*,
    -- Calculate week from blok code
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
    END as week_number
  FROM jurnal_records jr
  WHERE jr.user_id IN (SELECT id FROM user_list)
)
SELECT
  u.full_name as Nama,
  du.confirmed_chosen_juz as Juz,
  'P' || jw.week_number as Pekan,
  ARRAY_AGG(DISTINCT jw.blok ORDER BY jw.blok) as Blok_Yang_Diisi,
  COUNT(DISTINCT jw.blok) as Jumlah_Blok,
  STRING_AGG(jw.tanggal_setor::text, ', ' ORDER BY jw.tanggal_setor) as Tanggal_Setor
FROM user_list u
LEFT JOIN daftar_ulang_submissions du ON du.user_id = u.id
LEFT JOIN jurnal_with_week jw ON jw.user_id = u.id
WHERE jw.week_number <= 4  -- Hanya P1-P4
AND jw.blok IS NOT NULL
GROUP BY u.full_name, du.confirmed_chosen_juz, jw.week_number
ORDER BY u.full_name, jw.week_number;

-- ============================================
-- 4. Cek raw jurnal records untuk 5 users
-- ============================================

SELECT
  u.full_name as Nama,
  jr.id as Record_ID,
  jr.blok as Blok,
  jr.tanggal_setor as Tanggal_Setor,
  jr.created_at as Created_At,
  -- Calculate week from blok
  CASE
    WHEN jr.blok ~ 'H(\d+)[A-D]' THEN
      'P' ||
      CASE
        WHEN CAST(REGEXP_REPLACE(jr.blok, 'H(\d+)[A-D]', '\1') AS INTEGER) BETWEEN 1 AND 10
          THEN CAST(REGEXP_REPLACE(jr.blok, 'H(\d+)[A-D]', '\1') AS INTEGER)::text
        WHEN CAST(REGEXP_REPLACE(jr.blok, 'H(\d+)[A-D]', '\1') AS INTEGER) BETWEEN 11 AND 20
          THEN (CAST(REGEXP_REPLACE(jr.blok, 'H(\d+)[A-D]', '\1') AS INTEGER) - 10)::text
        ELSE '?'
      END
    ELSE '?'
  END as Pekan
FROM users u
JOIN jurnal_records jr ON jr.user_id = u.id
WHERE u.full_name ILIKE ANY(ARRAY[
  '%Aam%Ummu Rifki%',
  '%Afiek%Noer%Arifah%',
  '%Afifah%nur%sholeha%',
  '%Afifah%',
  '%Agustinaeliyanti%'
])
ORDER BY u.full_name, jr.created_at DESC;

-- ============================================
-- 5. Summary: Cek siapa yang P1-P4 kosong total
-- ============================================

SELECT
  u.full_name as Nama,
  du.confirmed_chosen_juz as Juz,
  (SELECT COUNT(*) FROM jurnal_records WHERE user_id = u.id) as Total_Records,
  -- P1 check
  CASE
    WHEN EXISTS (
      SELECT 1 FROM jurnal_records jr2
      WHERE jr2.user_id = u.id
      AND jr2.blok IN ('H1A', 'H1B', 'H1C', 'H1D', 'H11A', 'H11B', 'H11C', 'H11D')
    ) THEN 'Ada'
    ELSE 'Kosong'
  END as P1_Status,
  -- P2 check
  CASE
    WHEN EXISTS (
      SELECT 1 FROM jurnal_records jr2
      WHERE jr2.user_id = u.id
      AND jr2.blok IN ('H2A', 'H2B', 'H2C', 'H2D', 'H12A', 'H12B', 'H12C', 'H12D')
    ) THEN 'Ada'
    ELSE 'Kosong'
  END as P2_Status,
  -- P3 check
  CASE
    WHEN EXISTS (
      SELECT 1 FROM jurnal_records jr2
      WHERE jr2.user_id = u.id
      AND jr2.blok IN ('H3A', 'H3B', 'H3C', 'H3D', 'H13A', 'H13B', 'H13C', 'H13D')
    ) THEN 'Ada'
    ELSE 'Kosong'
  END as P3_Status,
  -- P4 check
  CASE
    WHEN EXISTS (
      SELECT 1 FROM jurnal_records jr2
      WHERE jr2.user_id = u.id
      AND jr2.blok IN ('H4A', 'H4B', 'H4C', 'H4D', 'H14A', 'H14B', 'H14C', 'H14D')
    ) THEN 'Ada'
    ELSE 'Kosong'
  END as P4_Status
FROM users u
LEFT JOIN daftar_ulang_submissions du ON du.user_id = u.id
WHERE u.full_name ILIKE ANY(ARRAY[
  '%Aam%Ummu Rifki%',
  '%Afiek%Noer%Arifah%',
  '%Afifah%nur%sholeha%',
  '%Afifah%',
  '%Agustinaeliyanti%'
])
ORDER BY u.full_name;
