-- Update analyze_halaqah_availability_by_juz function to use halaqah.preferred_juz
-- This function analyzes halaqah capacity per juz and determines if more halaqah are needed
-- This version uses halaqah.preferred_juz instead of programs.juz_selection

-- Drop the existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS analyze_halaqah_availability_by_juz(UUID);

CREATE FUNCTION analyze_halaqah_availability_by_juz(p_batch_id UUID)
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
      -- Use preferred_juz from halaqah table
      h.preferred_juz,
      -- Count students from daftar_ulang_submissions table
      -- For tashih_ujian classes, ujian_halaqah_id and tashih_halaqah_id can be the same
      -- We need to count each user only once per halaqah
      COALESCE((
        SELECT COUNT(DISTINCT CASE
          WHEN dus.ujian_halaqah_id = h.id THEN dus.user_id
          WHEN dus.tashih_halaqah_id = h.id AND NOT dus.is_tashih_umum THEN dus.user_id
          ELSE NULL
        END)
        FROM public.daftar_ulang_submissions dus
        WHERE dus.status = 'submitted'
          AND dus.batch_id = p_batch_id
          AND (dus.ujian_halaqah_id = h.id OR dus.tashih_halaqah_id = h.id)
      ), 0) AS current_students,
      -- Calculate available slots
      (h.max_students - COALESCE((
        SELECT COUNT(DISTINCT CASE
          WHEN dus.ujian_halaqah_id = h.id THEN dus.user_id
          WHEN dus.tashih_halaqah_id = h.id AND NOT dus.is_tashih_umum THEN dus.user_id
          ELSE NULL
        END)
        FROM public.daftar_ulang_submissions dus
        WHERE dus.status = 'submitted'
          AND dus.batch_id = p_batch_id
          AND (dus.ujian_halaqah_id = h.id OR dus.tashih_halaqah_id = h.id)
      ), 0)) AS available_slots
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
      COALESCE(SUM(hc.max_students), 0)::INTEGER AS total_capacity,
      COALESCE(SUM(hc.current_students), 0)::INTEGER AS total_filled,
      COALESCE(SUM(hc.available_slots), 0)::INTEGER AS total_available,
      -- Calculate needed halaqah: CEIL((total_thalibah - total_available) / 5) if positive
      CASE
        WHEN (jd.total_thalibah - COALESCE(SUM(hc.available_slots), 0)) > 0 THEN
          CEIL((jd.total_thalibah - COALESCE(SUM(hc.available_slots), 0))::NUMERIC / v_min_capacity)
        ELSE 0
      END::INTEGER AS needed_halaqah,
      -- Calculate utilization percentage
      CASE
        WHEN COALESCE(SUM(hc.max_students), 0) = 0 THEN 0
        ELSE ROUND((SUM(hc.current_students)::NUMERIC / NULLIF(SUM(hc.max_students), 0)) * 100, 2)
      END AS utilization_percentage
    FROM juz_data jd
    LEFT JOIN halaqah_counts hc ON (
      -- Match halaqah with juz using preferred_juz field
      -- If preferred_juz is NULL, include the halaqah for all juz (fallback behavior)
      hc.preferred_juz IS NOT NULL AND (
        hc.preferred_juz LIKE '%' || jd.juz_code::text || '%' OR
        hc.preferred_juz LIKE '%' || jd.juz_number::text || '%'
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
    COALESCE(
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
        WHERE hc.preferred_juz IS NOT NULL AND (
          hc.preferred_juz LIKE '%' || jh.juz_code::text || '%' OR
          hc.preferred_juz LIKE '%' || jh.juz_number::text || '%'
        )
      ),
      '[]'::jsonb
    ) AS halaqah_details
  FROM juz_halaqah jh
  ORDER BY jh.juz_number, jh.juz_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION analyze_halaqah_availability_by_juz IS 'Analyzes halaqah capacity per juz using halaqah.preferred_juz field (no juz_selection in programs required)';
