-- Cek format RAW blok di database untuk user tertentu
-- Ini akan menampilkan format asli bagaimana blok disimpan

-- 1. Cek format blok untuk Aam Ummu Rifki
SELECT
  u.full_name as Nama,
  jr.id as record_id,
  jr.blok as blok_raw,
  pg_typeof(jr.blok) as blok_type,
  length(jr.blok) as blok_length,
  substring(jr.blok, 1, 50) as blok_preview
FROM users u
JOIN jurnal_records jr ON jr.user_id = u.id
WHERE u.full_name ILIKE '%Aam%Ummu Rifki%'
ORDER BY jr.blok;

-- 2. Cek apakah ada blok dengan format JSON/array
SELECT
  u.full_name as Nama,
  COUNT(*) as total_records,
  COUNT(CASE WHEN jr.blok::text LIKE '[%' THEN 1 END) as json_format,
  COUNT(CASE WHEN jr.blok::text NOT LIKE '[%' THEN 1 END) as plain_format,
  STRING_AGG(DISTINCT CASE WHEN jr.blok::text LIKE '[%' THEN substring(jr.blok::text, 1, 20) END, ', ') as json_samples
FROM users u
JOIN jurnal_records jr ON jr.user_id = u.id
WHERE u.full_name ILIKE ANY(ARRAY['%Aam%Ummu Rifki%', '%Afiek%Noer%'])
GROUP BY u.full_name;

-- 3. Cek mapping blok untuk P1-P4 (H1A-H4D) untuk Aam
SELECT
  jr.blok,
  calculateWeekFromBlok_simple(jr.blok) as calculated_week,
  jr.tanggal_setor
FROM users u
JOIN jurnal_records jr ON jr.user_id = u.id
CROSS JOIN LATERAL (
  SELECT
    CASE
      WHEN jr.blok ~ 'H(\d+)' THEN
        CASE
          WHEN CAST(SUBSTRING(jr.blok, 'H(\d+)') AS INTEGER) BETWEEN 1 AND 10 THEN
            CAST(SUBSTRING(jr.blok, 'H(\d+)') AS INTEGER)
          WHEN CAST(SUBSTRING(jr.blok, 'H(\d+)') AS INTEGER) BETWEEN 11 AND 20 THEN
            CAST(SUBSTRING(jr.blok, 'H(\d+)') AS INTEGER) - 10
          ELSE NULL
        END
      ELSE NULL
    END as week_num
) as calc
WHERE u.full_name ILIKE '%Aam%Ummu Rifki%'
  AND jr.blok IS NOT NULL
ORDER BY calc.week_num, jr.blok;
