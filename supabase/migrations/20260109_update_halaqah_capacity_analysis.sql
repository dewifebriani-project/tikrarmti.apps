-- Update analyze_halaqah_availability_by_juz function to use new tables and include capacity analysis
-- This function analyzes halaqah capacity per juz and determines if more halaqah are needed

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
  SELECT
    jo.code AS juz_code,
    jo.juz_number AS juz_number,
    jo.name AS juz_name,

    -- Count thalibah (selected) for this juz
    (
      SELECT COUNT(DISTINCT pt.user_id)
      FROM public.pendaftaran_tikrar_tahfidz pt
      WHERE pt.batch_id = p_batch_id
        AND pt.selection_status = 'selected'
        AND pt.chosen_juz = jo.code
    )::INTEGER AS total_thalibah,

    -- Count halaqah for this juz
    (
      SELECT COUNT(DISTINCT h.id)
      FROM public.halaqah h
      INNER JOIN public.programs p ON p.id = h.program_id
      WHERE p.batch_id = p_batch_id
        AND (p.juz_selection::text LIKE '%' || jo.code::text || '%'
             OR p.juz_selection::text LIKE '%' || jo.juz_number::text || '%')
        AND h.status = 'active'
    )::INTEGER AS total_halaqah,

    -- Calculate total capacity
    (
      SELECT COALESCE(SUM(h.max_students), 0)
      FROM public.halaqah h
      INNER JOIN public.programs p ON p.id = h.program_id
      WHERE p.batch_id = p_batch_id
        AND (p.juz_selection::text LIKE '%' || jo.code::text || '%'
             OR p.juz_selection::text LIKE '%' || jo.juz_number::text || '%')
        AND h.status = 'active'
    )::INTEGER AS total_capacity,

    -- Calculate filled slots (from halaqah_students + daftar_ulang_submissions)
    (
      WITH enrolled AS (
        SELECT DISTINCT student_id, halaqah_id
        FROM public.halaqah_students hs
        INNER JOIN public.halaqah h ON h.id = hs.halaqah_id
        INNER JOIN public.programs p ON p.id = h.program_id
        WHERE p.batch_id = p_batch_id
          AND (p.juz_selection::text LIKE '%' || jo.code::text || '%'
               OR p.juz_selection::text LIKE '%' || jo.juz_number::text || '%')
          AND hs.status = 'active'
      ),
      submitted AS (
        SELECT DISTINCT user_id, ujian_halaqah_id, tashih_halaqah_id
        FROM public.daftar_ulang_submissions dus
        WHERE dus.batch_id = p_batch_id
          AND dus.status = 'submitted'
      ),
      combined AS (
        -- From enrolled
        SELECT student_id as user_id, halaqah_id
        FROM enrolled
        UNION
        -- From submitted (ujian)
        SELECT user_id, ujian_halaqah_id as halaqah_id
        FROM submitted
        WHERE ujian_halaqah_id IS NOT NULL
        UNION
        -- From submitted (tashih)
        SELECT user_id, tashih_halaqah_id as halaqah_id
        FROM submitted
        WHERE tashih_halaqah_id IS NOT NULL
          AND is_tashih_umum = false
      )
      SELECT COUNT(DISTINCT user_id)
      FROM combined
      WHERE halaqah_id IN (
        SELECT h.id
        FROM public.halaqah h
        INNER JOIN public.programs p ON p.id = h.program_id
        WHERE p.batch_id = p_batch_id
          AND (p.juz_selection::text LIKE '%' || jo.code::text || '%'
               OR p.juz_selection::text LIKE '%' || jo.juz_number::text || '%')
          AND h.status = 'active'
      )
    )::INTEGER AS total_filled,

    -- Calculate available slots
    (
      SELECT COALESCE(SUM(h.max_students), 0) -
             COALESCE((
               WITH enrolled AS (
                 SELECT DISTINCT student_id, halaqah_id
                 FROM public.halaqah_students hs
                 INNER JOIN public.halaqah h ON h.id = hs.halaqah_id
                 INNER JOIN public.programs p ON p.id = h.program_id
                 WHERE p.batch_id = p_batch_id
                   AND (p.juz_selection::text LIKE '%' || jo.code::text || '%'
                        OR p.juz_selection::text LIKE '%' || jo.juz_number::text || '%')
                   AND hs.status = 'active'
               ),
               submitted AS (
                 SELECT DISTINCT user_id, ujian_halaqah_id, tashih_halaqah_id
                 FROM public.daftar_ulang_submissions dus
                 WHERE dus.batch_id = p_batch_id
                   AND dus.status = 'submitted'
               ),
               combined AS (
                 SELECT student_id as user_id, halaqah_id
                 FROM enrolled
                 UNION
                 SELECT user_id, ujian_halaqah_id as halaqah_id
                 FROM submitted
                 WHERE ujian_halaqah_id IS NOT NULL
                 UNION
                 SELECT user_id, tashih_halaqah_id as halaqah_id
                 FROM submitted
                 WHERE tashih_halaqah_id IS NOT NULL
                   AND is_tashih_umum = false
               )
               SELECT COUNT(DISTINCT user_id)
               FROM combined
               WHERE halaqah_id = h.id
             ), 0)
      FROM public.halaqah h
      INNER JOIN public.programs p ON p.id = h.program_id
      WHERE p.batch_id = p_batch_id
        AND (p.juz_selection::text LIKE '%' || jo.code::text || '%'
             OR p.juz_selection::text LIKE '%' || jo.juz_number::text || '%')
        AND h.status = 'active'
    )::INTEGER AS total_available,

    -- Calculate needed halaqah (based on minimum 5 thalibah per halaqah)
    -- Formula: CEIL((total_thalibah - total_available) / 5) if positive, else 0
    (
      SELECT GREATEST(
        CEIL((
          (SELECT COUNT(DISTINCT pt.user_id)
           FROM public.pendaftaran_tikrar_tahfidz pt
           WHERE pt.batch_id = p_batch_id
             AND pt.selection_status = 'selected'
             AND pt.chosen_juz = jo.code) -
          (SELECT COALESCE(SUM(h.max_students), 0) -
             COALESCE((
               WITH enrolled AS (
                 SELECT DISTINCT student_id, halaqah_id
                 FROM public.halaqah_students hs
                 INNER JOIN public.halaqah h2 ON h2.id = hs.halaqah_id
                 INNER JOIN public.programs p2 ON p2.id = h2.program_id
                 WHERE p2.batch_id = p_batch_id
                   AND (p2.juz_selection::text LIKE '%' || jo.code::text || '%'
                        OR p2.juz_selection::text LIKE '%' || jo.juz_number::text || '%')
                   AND hs.status = 'active'
               ),
               submitted AS (
                 SELECT DISTINCT user_id, ujian_halaqah_id, tashih_halaqah_id
                 FROM public.daftar_ulang_submissions dus
                 WHERE dus.batch_id = p_batch_id
                   AND dus.status = 'submitted'
               ),
               combined AS (
                 SELECT student_id as user_id, halaqah_id
                 FROM enrolled
                 UNION
                 SELECT user_id, ujian_halaqah_id as halaqah_id
                 FROM submitted
                 WHERE ujian_halaqah_id IS NOT NULL
                 UNION
                 SELECT user_id, tashih_halaqah_id as halaqah_id
                 FROM submitted
                 WHERE tashih_halaqah_id IS NOT NULL
                   AND is_tashih_umum = false
               )
               SELECT COUNT(DISTINCT user_id)
               FROM combined
               WHERE halaqah_id = h.id
             ), 0)
          )::NUMERIC / v_min_capacity
        ), 0
      )
    )::INTEGER AS needed_halaqah,

    -- Calculate utilization percentage
    (
      SELECT CASE
        WHEN SUM(h.max_students) = 0 OR SUM(h.max_students) IS NULL THEN 0
        ELSE ROUND(
          (
            COALESCE((
              WITH enrolled AS (
                SELECT DISTINCT student_id, halaqah_id
                FROM public.halaqah_students hs
                INNER JOIN public.halaqah h2 ON h2.id = hs.halaqah_id
                INNER JOIN public.programs p2 ON p2.id = h2.program_id
                WHERE p2.batch_id = p_batch_id
                  AND (p2.juz_selection::text LIKE '%' || jo.code::text || '%'
                       OR p2.juz_selection::text LIKE '%' || jo.juz_number::text || '%')
                  AND hs.status = 'active'
              ),
              submitted AS (
                SELECT DISTINCT user_id, ujian_halaqah_id, tashih_halaqah_id
                FROM public.daftar_ulang_submissions dus
                WHERE dus.batch_id = p_batch_id
                  AND dus.status = 'submitted'
              ),
              combined AS (
                SELECT student_id as user_id, halaqah_id
                FROM enrolled
                UNION
                SELECT user_id, ujian_halaqah_id as halaqah_id
                FROM submitted
                WHERE ujian_halaqah_id IS NOT NULL
                UNION
                SELECT user_id, tashih_halaqah_id as halaqah_id
                FROM submitted
                WHERE tashih_halaqah_id IS NOT NULL
                  AND is_tashih_umum = false
              )
              SELECT COUNT(DISTINCT user_id)
              FROM combined
              WHERE halaqah_id = h.id
            ), 0) * 100.0 / SUM(h.max_students)
          ), 2
        )
      END
      FROM public.halaqah h
      INNER JOIN public.programs p ON p.id = h.program_id
      WHERE p.batch_id = p_batch_id
        AND (p.juz_selection::text LIKE '%' || jo.code::text || '%'
             OR p.juz_selection::text LIKE '%' || jo.juz_number::text || '%')
        AND h.status = 'active'
    )::NUMERIC AS utilization_percentage,

    -- Get halaqah details with current counts
    (
      SELECT JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'id', h.id,
          'name', h.name,
          'max_students', h.max_students,
          'day_of_week', h.day_of_week,
          'start_time', h.start_time,
          'end_time', h.end_time,
          'current_students', COALESCE((
            WITH enrolled AS (
              SELECT DISTINCT student_id, halaqah_id
              FROM public.halaqah_students hs
              WHERE hs.halaqah_id = h.id AND hs.status = 'active'
            ),
            submitted AS (
              SELECT DISTINCT user_id, ujian_halaqah_id, tashih_halaqah_id
              FROM public.daftar_ulang_submissions dus
              WHERE dus.status = 'submitted'
            ),
            combined AS (
              SELECT student_id as user_id, halaqah_id
              FROM enrolled
              WHERE halaqah_id = h.id
              UNION
              SELECT user_id, ujian_halaqah_id as halaqah_id
              FROM submitted
              WHERE ujian_halaqah_id = h.id
              UNION
              SELECT user_id, tashih_halaqah_id as halaqah_id
              FROM submitted
              WHERE tashih_halaqah_id = h.id AND is_tashih_umum = false
            )
            SELECT COUNT(DISTINCT user_id)
            FROM combined
            WHERE halaqah_id = h.id
          ), 0),
          'available_slots', (h.max_students - COALESCE((
            WITH enrolled AS (
              SELECT DISTINCT student_id, halaqah_id
              FROM public.halaqah_students hs
              WHERE hs.halaqah_id = h.id AND hs.status = 'active'
            ),
            submitted AS (
              SELECT DISTINCT user_id, ujian_halaqah_id, tashih_halaqah_id
              FROM public.daftar_ulang_submissions dus
              WHERE dus.status = 'submitted'
            ),
            combined AS (
              SELECT student_id as user_id, halaqah_id
              FROM enrolled
              WHERE halaqah_id = h.id
              UNION
              SELECT user_id, ujian_halaqah_id as halaqah_id
              FROM submitted
              WHERE ujian_halaqah_id = h.id
              UNION
              SELECT user_id, tashih_halaqah_id as halaqah_id
              FROM submitted
              WHERE tashih_halaqah_id = h.id AND is_tashih_umum = false
            )
            SELECT COUNT(DISTINCT user_id)
            FROM combined
            WHERE halaqah_id = h.id
          ), 0)),
          'utilization_percent', CASE
            WHEN h.max_students = 0 OR h.max_students IS NULL THEN 0
            ELSE ROUND((
              COALESCE((
                WITH enrolled AS (
                  SELECT DISTINCT student_id, halaqah_id
                  FROM public.halaqah_students hs
                  WHERE hs.halaqah_id = h.id AND hs.status = 'active'
                ),
                submitted AS (
                  SELECT DISTINCT user_id, ujian_halaqah_id, tashih_halaqah_id
                  FROM public.daftar_ulang_submissions dus
                  WHERE dus.status = 'submitted'
                ),
                combined AS (
                  SELECT student_id as user_id, halaqah_id
                  FROM enrolled
                  WHERE halaqah_id = h.id
                  UNION
                  SELECT user_id, ujian_halaqah_id as halaqah_id
                  FROM submitted
                  WHERE ujian_halaqah_id = h.id
                  UNION
                  SELECT user_id, tashih_halaqah_id as halaqah_id
                  FROM submitted
                  WHERE tashih_halaqah_id = h.id AND is_tashih_umum = false
                )
                SELECT COUNT(DISTINCT user_id)
                FROM combined
                WHERE halaqah_id = h.id
              ), 0) * 100.0 / h.max_students
            ), 2)
          END
        )
      )
      FROM public.halaqah h
      INNER JOIN public.programs p ON p.id = h.program_id
      WHERE p.batch_id = p_batch_id
        AND (p.juz_selection::text LIKE '%' || jo.code::text || '%'
             OR p.juz_selection::text LIKE '%' || jo.juz_number::text || '%')
        AND h.status = 'active'
    ) AS halaqah_details

  FROM public.juz_options jo
  WHERE jo.is_active = true
    AND jo.juz_number IN (28, 29, 30) -- Only active juz for Tikrar Tahfidz
  ORDER BY jo.juz_number, jo.part;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION analyze_halaqah_availability_by_juz IS 'Analyzes halaqah capacity per juz with minimum 5 thalibah per halaqah requirement';
