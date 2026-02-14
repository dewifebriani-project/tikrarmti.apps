-- ============================================
-- Cek FORMAT BLOK yang sebenarnya ada di database
-- ============================================

-- 1. Cek format blok mentah (raw values)
SELECT
  u.full_name as Nama,
  jr.blok as Blok_Raw,
  jr.blok::text as Blok_Text,
  pg_typeof(jr.blok) as Tipe_Data,
  length(jr.blok::text) as Panjang_String
FROM users u
JOIN jurnal_records jr ON jr.user_id = u.id
WHERE u.full_name ILIKE ANY(ARRAY[
  '%Aam%Ummu Rifki%',
  '%Afiek%Noer%Arifah%',
  '%Afifah%nur%sholeha%',
  '%Agustinaeliyanti%'
])
ORDER BY u.full_name, jr.created_at DESC
LIMIT 20;

-- 2. Cek format blok unik untuk 5 users
SELECT DISTINCT
  u.full_name as Nama,
  jr.blok as Blok_Value,
  pg_typeof(jr.blok) as Tipe_Data
FROM users u
JOIN jurnal_records jr ON jr.user_id = u.id
WHERE u.full_name ILIKE ANY(ARRAY[
  '%Aam%Ummu Rifki%',
  '%Afiek%Noer%Arifah%',
  '%Afifah%nur%sholeha%',
  '%Agustinaeliyanti%'
])
ORDER BY u.full_name, jr.blok;

-- 3. Cek apakah blok match dengan regex H(\d+)[A-D]
SELECT
  u.full_name as Nama,
  jr.blok as Blok_Value,
  jr.blok ~ 'H(\d+)[A-D]' as Match_Regex,
  CASE
    WHEN jr.blok ~ 'H(\d+)[A-D]' THEN 'VALID'
    ELSE 'INVALID'
  END as Status,
  -- Extract blok info if match
  CASE
    WHEN jr.blok ~ 'H(\d+)[A-D]' THEN
      'H' || CAST(REGEXP_REPLACE(jr.blok, 'H(\d+)[A-D]', '\1') AS INTEGER) || ' = P' ||
      CASE
        WHEN CAST(REGEXP_REPLACE(jr.blok, 'H(\d+)[A-D]', '\1') AS INTEGER) BETWEEN 1 AND 10
          THEN CAST(REGEXP_REPLACE(jr.blok, 'H(\d+)[A-D]', '\1') AS INTEGER)::text
        WHEN CAST(REGEXP_REPLACE(jr.blok, 'H(\d+)[A-D]', '\1') AS INTEGER) BETWEEN 11 AND 20
          THEN (CAST(REGEXP_REPLACE(jr.blok, 'H(\d+)[A-D]', '\1') AS INTEGER) - 10)::text
        ELSE '?'
      END
    ELSE 'N/A'
  END as Pekan_Calculated
FROM users u
JOIN jurnal_records jr ON jr.user_id = u.id
WHERE u.full_name ILIKE ANY(ARRAY[
  '%Aam%Ummu Rifki%',
  '%Afiek%Noer%Arifah%',
  '%Afifah%nur%sholeha%',
  '%Agustinaeliyanti%'
])
ORDER BY u.full_name, jr.created_at DESC;

-- 4. Cek count per format blok - FIXED
SELECT
  u.full_name as Nama,
  COUNT(*) as Total_Records,
  COUNT(CASE WHEN jr.blok ~ '^H\d+[A-D]$' THEN 1 END) as Valid_Format,
  COUNT(CASE WHEN jr.blok IS NULL THEN 1 END) as Null_Blok,
  COUNT(CASE WHEN jr.blok ~ '^H\d+[A-D]$' THEN 0 END) as Invalid_Format,
  -- Sample some blok values
  STRING_AGG(DISTINCT jr.blok, ', ' ORDER BY jr.blok) as Sample_Bloks
FROM users u
JOIN jurnal_records jr ON jr.user_id = u.id
WHERE u.full_name ILIKE ANY(ARRAY[
  '%Aam%Ummu Rifki%',
  '%Afiek%Noer%Arifah%',
  '%Afifah%nur%sholeha%',
  '%Agustinaeliyanti%'
])
GROUP BY u.full_name
ORDER BY u.full_name;
