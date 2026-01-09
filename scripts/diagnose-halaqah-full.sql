-- Diagnostic script to check halaqah data and test the function

-- 1. Check if halaqah table exists and has data for the batch
SELECT
  h.id,
  h.name,
  h.preferred_juz,
  h.max_students,
  h.status,
  p.id as program_id,
  p.batch_id
FROM public.halaqah h
INNER JOIN public.programs p ON p.id = h.program_id
WHERE p.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49'::UUID
ORDER BY h.name;

-- 2. Check juz_options
SELECT
  jo.code,
  jo.juz_number,
  jo.name,
  jo.is_active
FROM public.juz_options jo
WHERE jo.juz_number IN (28, 29, 30)
ORDER BY jo.juz_number, jo.part;

-- 3. Check pendaftaran_tikrar_tahfidz data
SELECT
  pt.chosen_juz,
  pt.selection_status,
  COUNT(DISTINCT pt.user_id) as count
FROM public.pendaftaran_tikrar_tahfidz pt
WHERE pt.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49'::UUID
GROUP BY pt.chosen_juz, pt.selection_status
ORDER BY pt.chosen_juz;

-- 4. Test just the juz_data CTE
WITH juz_data AS (
  SELECT
    jo.code AS juz_code,
    jo.juz_number,
    jo.name AS juz_name,
    COALESCE((
      SELECT COUNT(DISTINCT pt.user_id)
      FROM public.pendaftaran_tikrar_tahfidz pt
      WHERE pt.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49'::UUID
        AND pt.selection_status = 'selected'
        AND pt.chosen_juz = jo.code
    ), 0) AS total_thalibah
  FROM public.juz_options jo
  WHERE jo.is_active = true
    AND jo.juz_number IN (28, 29, 30)
)
SELECT * FROM juz_data;

-- 5. Test just the halaqah_counts CTE
SELECT
  h.id AS halaqah_id,
  h.name AS halaqah_name,
  h.max_students,
  h.preferred_juz,
  h.max_students AS available_slots
FROM public.halaqah h
INNER JOIN public.programs p ON p.id = h.program_id
WHERE p.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49'::UUID
  AND h.status = 'active';

-- 6. Test the full join
WITH juz_data AS (
  SELECT
    jo.code AS juz_code,
    jo.juz_number,
    jo.name AS juz_name,
    COALESCE((
      SELECT COUNT(DISTINCT pt.user_id)
      FROM public.pendaftaran_tikrar_tahfidz pt
      WHERE pt.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49'::UUID
        AND pt.selection_status = 'selected'
        AND pt.chosen_juz = jo.code
    ), 0) AS total_thalibah
  FROM public.juz_options jo
  WHERE jo.is_active = true
    AND jo.juz_number IN (28, 29, 30)
),
halaqah_counts AS (
  SELECT
    h.id AS halaqah_id,
    h.name AS halaqah_name,
    h.max_students,
    h.preferred_juz,
    h.max_students AS available_slots
  FROM public.halaqah h
  INNER JOIN public.programs p ON p.id = h.program_id
  WHERE p.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49'::UUID
    AND h.status = 'active'
)
SELECT
  jd.juz_code,
  jd.juz_number,
  jd.juz_name,
  jd.total_thalibah,
  COUNT(DISTINCT hc.halaqah_id) AS total_halaqah,
  COALESCE(SUM(hc.max_students), 0)::INTEGER AS total_capacity,
  COALESCE(SUM(hc.available_slots), 0)::INTEGER AS total_available
FROM juz_data jd
LEFT JOIN halaqah_counts hc ON (
  hc.preferred_juz IS NOT NULL AND (
    hc.preferred_juz LIKE '%' || jd.juz_code::text || '%' OR
    hc.preferred_juz LIKE '%' || jd.juz_number::text || '%'
  )
)
GROUP BY jd.juz_code, jd.juz_number, jd.juz_name, jd.total_thalibah
ORDER BY jd.juz_number, jd.juz_code;
