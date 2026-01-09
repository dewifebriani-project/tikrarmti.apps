-- Update analyze_halaqah_availability_by_juz function to use halaqah.preferred_juz
-- This function analyzes halaqah capacity per juz and determines if more halaqah are needed
-- This version uses halaqah.preferred_juz instead of programs.juz_selection

-- Drop the existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS analyze_halaqah_availability_by_juz(UUID) CASCADE;

CREATE FUNCTION analyze_halaqah_availability_by_juz(p_batch_id UUID)
RETURNS TABLE (
  juz_number INTEGER,
  juz_name TEXT,
  total_thalibah INTEGER,
  thalibah_breakdown JSONB,  -- Breakdown per juz_code (28A, 28B, etc.)
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
    -- Get all thalibah counts per juz_code (28A, 28B, etc.)
    SELECT
      jo.code AS juz_code,
      jo.juz_number,
      jo.part,
      jo.name AS juz_name,
      COALESCE((
        SELECT COUNT(DISTINCT pt.user_id)::INTEGER
        FROM public.pendaftaran_tikrar_tahfidz pt
        WHERE pt.batch_id = p_batch_id
          AND pt.selection_status = 'selected'
          AND pt.chosen_juz = jo.code
      ), 0)::INTEGER AS total_thalibah
    FROM public.juz_options jo
    WHERE jo.is_active = true
      AND jo.juz_number IN (28, 29, 30)
  ),
  juz_aggregated AS (
    -- Aggregate by juz_number (combine 28A and 28B into Juz 28)
    SELECT
      juz_number,
      juz_number::TEXT || ' (Halaman ' ||
        MIN(CASE WHEN part = 'A' THEN start_page END) || '-' ||
        MAX(CASE WHEN part = 'B' THEN end_page END) || ')' AS juz_name,
      SUM(total_thalibah)::INTEGER AS total_thalibah,
      JSONB_OBJECT_AGG(
        juz_code,
        JSONB_BUILD_OBJECT(
          'code', juz_code,
          'name', juz_name,
          'part', part,
          'thalibah_count', total_thalibah
        )
      ) FILTER (WHERE total_thalibah > 0) AS thalibah_breakdown
    FROM juz_data
    GROUP BY juz_number
  ),
  halaqah_counts AS (
    -- Calculate filled slots for each halaqah
    -- Include halaqah that have class types: tashih_ujian or ujian_only
    -- Exclude halaqah that only have tashih_only (for pra-tikrar)
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
      -- No current students yet - this is for capacity planning
      -- We're analyzing if we have enough halaqah for selected thalibah
      0 AS current_students,
      -- Use max_students from halaqah_class_types if available, otherwise from halaqah
      COALESCE(
        (SELECT SUM(hct.max_students)
         FROM public.halaqah_class_types hct
         WHERE hct.halaqah_id = h.id
           AND hct.class_type IN ('tashih_ujian', 'ujian_only')
           AND hct.is_active = true),
        h.max_students
      ) AS available_slots
    FROM public.halaqah h
    LEFT JOIN public.programs p ON p.id = h.program_id
    WHERE (p.batch_id = p_batch_id OR h.program_id IS NULL)
      AND h.status = 'active'
      -- Only include halaqah that have tashih_ujian or ujian_only class types
      AND EXISTS (
        SELECT 1
        FROM public.halaqah_class_types hct
        WHERE hct.halaqah_id = h.id
          AND hct.class_type IN ('tashih_ujian', 'ujian_only')
          AND hct.is_active = true
      )
  ),
  juz_halaqah AS (
    -- Aggregate halaqah data per juz_number (combined A and B)
    SELECT
      ja.juz_number,
      ja.juz_name,
      ja.total_thalibah,
      ja.thalibah_breakdown,
      COUNT(DISTINCT hc.halaqah_id)::INTEGER AS total_halaqah,
      COALESCE(SUM(hc.max_students), 0)::INTEGER AS total_capacity,
      COALESCE(SUM(hc.current_students), 0)::INTEGER AS total_filled,
      COALESCE(SUM(hc.available_slots), 0)::INTEGER AS total_available,
      -- Calculate needed halaqah: CEIL((total_thalibah - total_available) / 5) if positive
      CASE
        WHEN (ja.total_thalibah - COALESCE(SUM(hc.available_slots), 0)) > 0 THEN
          CEIL((ja.total_thalibah - COALESCE(SUM(hc.available_slots), 0))::NUMERIC / v_min_capacity)
        ELSE 0
      END::INTEGER AS needed_halaqah,
      -- Calculate utilization percentage
      CASE
        WHEN COALESCE(SUM(hc.max_students), 0) = 0 THEN 0
        ELSE ROUND((SUM(hc.current_students)::NUMERIC / NULLIF(SUM(hc.max_students), 0)) * 100, 2)
      END AS utilization_percentage
    FROM juz_aggregated ja
    LEFT JOIN halaqah_counts hc ON (
      -- Match halaqah with juz using preferred_juz field
      -- If preferred_juz is NULL, the halaqah can teach all juz (include for all)
      hc.preferred_juz IS NULL OR (
        hc.preferred_juz IS NOT NULL AND (
          hc.preferred_juz LIKE '%' || ja.juz_number::text || '%'
        )
      )
    )
    GROUP BY ja.juz_number, ja.juz_name, ja.total_thalibah, ja.thalibah_breakdown
  )
  SELECT
    jh.juz_number,
    jh.juz_name,
    jh.total_thalibah,
    jh.thalibah_breakdown,
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
        WHERE hc.preferred_juz IS NULL OR (
          hc.preferred_juz IS NOT NULL AND (
            hc.preferred_juz LIKE '%' || jh.juz_number::text || '%'
          )
        )
      ),
      '[]'::jsonb
    ) AS halaqah_details
  FROM juz_halaqah jh
  ORDER BY jh.juz_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION analyze_halaqah_availability_by_juz IS 'Analyzes halaqah capacity per juz using halaqah.preferred_juz field (no juz_selection in programs required)';
