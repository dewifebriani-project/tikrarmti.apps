-- Script untuk memverifikasi dan memperbaiki fungsi analyze_halaqah_availability_by_juz
-- Jalankan ini di Supabase SQL Editor

-- Drop fungsi lama jika ada
DROP FUNCTION IF EXISTS public.analyze_halaqah_availability_by_juz(UUID);

-- Buat fungsi baru dengan perbaikan
CREATE OR REPLACE FUNCTION analyze_halaqah_availability_by_juz(p_batch_id UUID)
RETURNS TABLE (
  juz_code VARCHAR,
  juz_number INTEGER,
  juz_name VARCHAR,
  total_thalibah INTEGER,
  total_halaqah INTEGER,
  total_capacity INTEGER,
  total_filled INTEGER,
  total_available INTEGER,
  needed_halaqah INTEGER,
  utilization_percentage NUMERIC,
  halaqah_details JSONB
) AS $$
DECLARE
  v_min_capacity INTEGER := 5; -- Minimum 5 thalibah per halaqah
BEGIN
  RETURN QUERY
  WITH juz_data AS (
    -- Get all thalibah counts per juz
    SELECT
      jo.code AS juz_code,
      jo.juz_number,
      jo.name AS juz_name,
      COALESCE((
        SELECT COUNT(DISTINCT pt.user_id)
        FROM public.pendaftaran_tikrar_tahfidz pt
        WHERE pt.batch_id = p_batch_id
          AND pt.selection_status = 'selected'
          AND pt.chosen_juz = jo.code
      ), 0) AS total_thalibah
    FROM public.juz_options jo
    WHERE jo.is_active = true
      AND jo.juz_number IN (28, 29, 30)
  ),
  halaqah_counts AS (
    -- Calculate filled slots for each halaqah
    SELECT
      h.id AS halaqah_id,
      h.name AS halaqah_name,
      h.max_students,
      h.day_of_week,
      h.start_time,
      h.end_time,
      h.program_id,
      -- Get juz options from program
      p.juz_selection,
      -- Count students from both tables
      COALESCE((
        SELECT COUNT(DISTINCT hs.student_id)
        FROM public.halaqah_students hs
        WHERE hs.halaqah_id = h.id AND hs.status = 'active'
      ), 0) +
      COALESCE((
        SELECT COUNT(DISTINCT dus.user_id)
        FROM public.daftar_ulang_submissions dus
        WHERE dus.status = 'submitted'
          AND (dus.ujian_halaqah_id = h.id OR dus.tashih_halaqah_id = h.id)
      ), 0) AS current_students,
      -- Calculate available slots
      (h.max_students - (
        COALESCE((
          SELECT COUNT(DISTINCT hs.student_id)
          FROM public.halaqah_students hs
          WHERE hs.halaqah_id = h.id AND hs.status = 'active'
        ), 0) +
        COALESCE((
          SELECT COUNT(DISTINCT dus.user_id)
          FROM public.daftar_ulang_submissions dus
          WHERE dus.status = 'submitted'
            AND (dus.ujian_halaqah_id = h.id OR dus.tashih_halaqah_id = h.id)
        ), 0)
      )) AS available_slots
    FROM public.halaqah h
    INNER JOIN public.programs p ON p.id = h.program_id
    WHERE p.batch_id = p_batch_id
      AND h.status = 'active'
  ),
  juz_halaqah AS (
    -- Aggregate halaqah data per juz
    SELECT
      jd.juz_code,
      jd.juz_number,
      jd.juz_name,
      jd.total_thalibah,
      COUNT(DISTINCT hc.halaqah_id) AS total_halaqah,
      SUM(hc.max_students)::INTEGER AS total_capacity,
      SUM(hc.current_students)::INTEGER AS total_filled,
      SUM(hc.available_slots)::INTEGER AS total_available,
      -- Calculate needed halaqah: CEIL((total_thalibah - total_available) / 5) if positive
      CASE
        WHEN (jd.total_thalibah - SUM(hc.available_slots)) > 0 THEN
          CEIL((jd.total_thalibah - SUM(hc.available_slots))::NUMERIC / v_min_capacity)
        ELSE 0
      END::INTEGER AS needed_halaqah,
      -- Calculate utilization percentage
      CASE
        WHEN SUM(hc.max_students) = 0 OR SUM(hc.max_students) IS NULL THEN 0
        ELSE ROUND((SUM(hc.current_students)::NUMERIC / NULLIF(SUM(hc.max_students), 0)) * 100, 2)
      END AS utilization_percentage
    FROM juz_data jd
    LEFT JOIN halaqah_counts hc ON (
      hc.program_id IN (
        SELECT id FROM public.programs
        WHERE batch_id = p_batch_id
          AND (juz_selection::text LIKE '%' || jd.juz_code::text || '%'
               OR juz_selection::text LIKE '%' || jd.juz_number::text || '%')
      )
    )
    GROUP BY jd.juz_code, jd.juz_number, jd.juz_name, jd.total_thalibah
  )
  SELECT
    jh.juz_code,
    jh.juz_number,
    jh.juz_name,
    jh.total_thalibah,
    jh.total_halaqah,
    jh.total_capacity,
    jh.total_filled,
    jh.total_available,
    jh.needed_halaqah,
    jh.utilization_percentage,
    -- Get halaqah details as JSONB
    (
      SELECT JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'id', hc.halaqah_id,
          'name', hc.halaqah_name,
          'max_students', hc.max_students,
          'day_of_week', hc.day_of_week,
          'start_time', hc.start_time,
          'end_time', hc.end_time,
          'current_students', hc.current_students,
          'available_slots', hc.available_slots,
          'utilization_percent', CASE
            WHEN hc.max_students = 0 OR hc.max_students IS NULL THEN 0
            ELSE ROUND((hc.current_students::NUMERIC / NULLIF(hc.max_students, 0)) * 100, 2)
          END
        )
        ORDER BY hc.halaqah_name
      )
      FROM halaqah_counts hc
      WHERE hc.program_id IN (
        SELECT id FROM public.programs
        WHERE batch_id = p_batch_id
          AND (juz_selection::text LIKE '%' || jh.juz_code::text || '%'
               OR juz_selection::text LIKE '%' || jh.juz_number::text || '%')
      )
    ) AS halaqah_details
  FROM juz_halaqah jh
  ORDER BY jh.juz_number, jh.juz_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION analyze_halaqah_availability_by_juz IS 'Analyzes halaqah capacity per juz with minimum 5 thalibah per halaqah requirement';

-- Verifikasi fungsi sudah dibuat
SELECT
  proname as function_name,
  prosrc as function_definition
FROM pg_proc
WHERE proname = 'analyze_halaqah_availability_by_juz';
