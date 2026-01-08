-- ============================================================================
-- Migration: Update system match priority for daftar ulang
-- Created: 2026-01-08
-- Description: Updates find_compatible_study_partners function with proper
--              priority: zona_waktu first, then within zona: juz option > juz number > cross juz
--              Each juz category: main_time_slot > backup_time_slot > different time
-- ============================================================================

-- Drop old function if exists (with different signature)
DROP FUNCTION IF EXISTS public.find_compatible_study_partners(p_user_id UUID, p_batch_id UUID, p_time_slot VARCHAR, p_juz VARCHAR);

CREATE OR REPLACE FUNCTION find_compatible_study_partners(
  p_user_id UUID,
  p_batch_id UUID,
  p_time_slot VARCHAR,
  p_juz VARCHAR,
  p_zona_waktu VARCHAR
)
RETURNS TABLE (
  partner_id UUID,
  partner_name VARCHAR,
  partner_juz VARCHAR,
  partner_juz_option VARCHAR,
  partner_juz_number INTEGER,
  partner_time_slot VARCHAR,
  partner_backup_time_slot VARCHAR,
  partner_zona_waktu VARCHAR,
  match_score INTEGER,
  match_details VARCHAR
) AS $$
DECLARE
  v_user_juz_option VARCHAR;
  v_user_juz_number INTEGER;
  v_user_main_time_slot VARCHAR;
  v_user_backup_time_slot VARCHAR;
BEGIN
  -- Get user's juz option, juz number, and time slots
  SELECT
    pt.chosen_juz,
    jo.juz_number,
    pt.main_time_slot,
    pt.backup_time_slot
  INTO
    v_user_juz_option,
    v_user_juz_number,
    v_user_main_time_slot,
    v_user_backup_time_slot
  FROM public.pendaftaran_tikrar_tahfidz pt
  LEFT JOIN public.juz_options jo ON jo.code = pt.chosen_juz
  WHERE pt.user_id = p_user_id AND pt.batch_id = p_batch_id;

  RETURN QUERY
  SELECT
    u.id AS partner_id,
    u.full_name::VARCHAR AS partner_name,
    pt.chosen_juz::VARCHAR AS partner_juz,
    pt.chosen_juz::VARCHAR AS partner_juz_option,
    jo.juz_number::INTEGER AS partner_juz_number,
    pt.main_time_slot::VARCHAR AS partner_time_slot,
    pt.backup_time_slot::VARCHAR AS partner_backup_time_slot,
    u.zona_waktu::VARCHAR AS partner_zona_waktu,
    -- Calculate match score
    CASE
      -- === ZONA WAKTU SAMA ===
      -- 1. Zona sama + Juz option sama + Main time sama (perfect match)
      WHEN u.zona_waktu = p_zona_waktu
        AND pt.chosen_juz = v_user_juz_option
        AND pt.main_time_slot = v_user_main_time_slot THEN 1000

      -- 2. Zona sama + Juz option sama + Backup time sama
      WHEN u.zona_waktu = p_zona_waktu
        AND pt.chosen_juz = v_user_juz_option
        AND pt.backup_time_slot = v_user_main_time_slot THEN 950

      -- 3. Zona sama + Juz option sama + Partner main time = user backup time
      WHEN u.zona_waktu = p_zona_waktu
        AND pt.chosen_juz = v_user_juz_option
        AND pt.main_time_slot = v_user_backup_time_slot THEN 940

      -- 4. Zona sama + Juz option sama + Partner backup time = user backup time
      WHEN u.zona_waktu = p_zona_waktu
        AND pt.chosen_juz = v_user_juz_option
        AND pt.backup_time_slot = v_user_backup_time_slot THEN 930

      -- 5. Zona sama + Juz option sama + Time beda (tapi zona sama)
      WHEN u.zona_waktu = p_zona_waktu
        AND pt.chosen_juz = v_user_juz_option THEN 900

      -- 6. Zona sama + Juz number sama + Main time sama
      WHEN u.zona_waktu = p_zona_waktu
        AND jo.juz_number = v_user_juz_number
        AND pt.chosen_juz != v_user_juz_option
        AND pt.main_time_slot = v_user_main_time_slot THEN 850

      -- 7. Zona sama + Juz number sama + Backup time sama
      WHEN u.zona_waktu = p_zona_waktu
        AND jo.juz_number = v_user_juz_number
        AND pt.chosen_juz != v_user_juz_option
        AND pt.backup_time_slot = v_user_main_time_slot THEN 840

      -- 8. Zona sama + Juz number sama + Partner main = user backup
      WHEN u.zona_waktu = p_zona_waktu
        AND jo.juz_number = v_user_juz_number
        AND pt.chosen_juz != v_user_juz_option
        AND pt.main_time_slot = v_user_backup_time_slot THEN 830

      -- 9. Zona sama + Juz number sama + Time beda
      WHEN u.zona_waktu = p_zona_waktu
        AND jo.juz_number = v_user_juz_number
        AND pt.chosen_juz != v_user_juz_option THEN 800

      -- 10. Zona sama + Lintas juz + Main time sama
      WHEN u.zona_waktu = p_zona_waktu
        AND jo.juz_number != v_user_juz_number
        AND pt.main_time_slot = v_user_main_time_slot THEN 750

      -- 11. Zona sama + Lintas juz + Backup time sama
      WHEN u.zona_waktu = p_zona_waktu
        AND jo.juz_number != v_user_juz_number
        AND pt.backup_time_slot = v_user_main_time_slot THEN 740

      -- 12. Zona sama + Lintas juz + Time beda
      WHEN u.zona_waktu = p_zona_waktu
        AND jo.juz_number != v_user_juz_number THEN 700

      -- === ZONA WAKTU BEDA - TAPI WAKTU SAMA ===
      -- 13. Zona beda + Juz option sama + Main time sama
      WHEN u.zona_waktu != p_zona_waktu
        AND pt.chosen_juz = v_user_juz_option
        AND pt.main_time_slot = v_user_main_time_slot THEN 650

      -- 14. Zona beda + Juz option sama + Partner backup = user main
      WHEN u.zona_waktu != p_zona_waktu
        AND pt.chosen_juz = v_user_juz_option
        AND pt.backup_time_slot = v_user_main_time_slot THEN 640

      -- 15. Zona beda + Juz option sama + Partner main = user backup
      WHEN u.zona_waktu != p_zona_waktu
        AND pt.chosen_juz = v_user_juz_option
        AND pt.main_time_slot = v_user_backup_time_slot THEN 630

      -- 16. Zona beda + Juz option sama + Both backup time same
      WHEN u.zona_waktu != p_zona_waktu
        AND pt.chosen_juz = v_user_juz_option
        AND pt.backup_time_slot = v_user_backup_time_slot THEN 620

      -- 17. Zona beda + Juz number sama + Main time sama
      WHEN u.zona_waktu != p_zona_waktu
        AND jo.juz_number = v_user_juz_number
        AND pt.chosen_juz != v_user_juz_option
        AND pt.main_time_slot = v_user_main_time_slot THEN 550

      -- 18. Zona beda + Juz number sama + Partner backup = user main
      WHEN u.zona_waktu != p_zona_waktu
        AND jo.juz_number = v_user_juz_number
        AND pt.chosen_juz != v_user_juz_option
        AND pt.backup_time_slot = v_user_main_time_slot THEN 540

      -- 19. Zona beda + Juz number sama + Partner main = user backup
      WHEN u.zona_waktu != p_zona_waktu
        AND jo.juz_number = v_user_juz_number
        AND pt.chosen_juz != v_user_juz_option
        AND pt.main_time_slot = v_user_backup_time_slot THEN 530

      -- 20. Zona beda + Lintas juz + Main time sama
      WHEN u.zona_waktu != p_zona_waktu
        AND jo.juz_number != v_user_juz_number
        AND pt.main_time_slot = v_user_main_time_slot THEN 500

      -- 21. Zona beda + Lintas juz + Partner backup = user main
      WHEN u.zona_waktu != p_zona_waktu
        AND jo.juz_number != v_user_juz_number
        AND pt.backup_time_slot = v_user_main_time_slot THEN 490

      ELSE 0
    END AS match_score,
    -- Match details for debugging/display
    CASE
      WHEN u.zona_waktu = p_zona_waktu AND pt.chosen_juz = v_user_juz_option AND pt.main_time_slot = v_user_main_time_slot THEN 'zona_waktu+juz_option+main'
      WHEN u.zona_waktu = p_zona_waktu AND pt.chosen_juz = v_user_juz_option AND pt.backup_time_slot = v_user_main_time_slot THEN 'zona_waktu+juz_option+backup_to_main'
      WHEN u.zona_waktu = p_zona_waktu AND pt.chosen_juz = v_user_juz_option THEN 'zona_waktu+juz_option'
      WHEN u.zona_waktu = p_zona_waktu AND jo.juz_number = v_user_juz_number THEN 'zona_waktu+juz_number'
      WHEN u.zona_waktu = p_zona_waktu THEN 'zona_waktu+cross_juz'
      WHEN pt.chosen_juz = v_user_juz_option AND pt.main_time_slot = v_user_main_time_slot THEN 'juz_option+main'
      WHEN pt.chosen_juz = v_user_juz_option THEN 'juz_option'
      WHEN jo.juz_number = v_user_juz_number THEN 'juz_number'
      ELSE 'cross_juz'
    END AS match_details
  FROM public.users u
  INNER JOIN public.pendaftaran_tikrar_tahfidz pt ON pt.user_id = u.id
  LEFT JOIN public.juz_options jo ON jo.code = pt.chosen_juz
  WHERE pt.batch_id = p_batch_id
    AND pt.selection_status = 'selected'
    AND u.id != p_user_id
    -- Must have at least one match (zona, main, or backup)
    AND (
      u.zona_waktu = p_zona_waktu OR
      pt.main_time_slot IN (v_user_main_time_slot, v_user_backup_time_slot) OR
      pt.backup_time_slot IN (v_user_main_time_slot, v_user_backup_time_slot)
    )
    -- Not already submitted with partner in daftar ulang
    AND NOT EXISTS (
      SELECT 1 FROM public.daftar_ulang_submissions dus
      WHERE dus.user_id = u.id
        AND dus.partner_user_id IS NOT NULL
        AND dus.status IN ('draft', 'submitted', 'approved')
    )
    -- Not already matched with this user
    AND NOT EXISTS (
      SELECT 1 FROM public.daftar_ulang_submissions dus
      WHERE dus.user_id = u.id
        AND dus.partner_user_id = p_user_id
    )
    -- Also exclude if user already has a submission (prevent double pairing)
    AND NOT EXISTS (
      SELECT 1 FROM public.daftar_ulang_submissions dus2
      WHERE dus2.user_id = p_user_id
        AND dus2.partner_user_id = u.id
    )
  ORDER BY match_score DESC, u.full_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a helper function to get all potential matches for analysis
CREATE OR REPLACE FUNCTION analyze_potential_matches(p_batch_id UUID)
RETURNS TABLE (
  user_id UUID,
  user_name VARCHAR,
  user_juz VARCHAR,
  user_juz_number INTEGER,
  user_zona_waktu VARCHAR,
  user_main_time VARCHAR,
  user_backup_time VARCHAR,
  total_matches INTEGER,
  zona_waktu_matches INTEGER,
  same_juz_matches INTEGER,
  cross_juz_matches INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.full_name::VARCHAR AS user_name,
    pt.chosen_juz::VARCHAR AS user_juz,
    jo.juz_number::INTEGER AS user_juz_number,
    u.zona_waktu::VARCHAR AS user_zona_waktu,
    pt.main_time_slot::VARCHAR AS user_main_time,
    pt.backup_time_slot::VARCHAR AS user_backup_time,
    -- Count total potential matches
    (SELECT COUNT(*)
     FROM public.pendaftaran_tikrar_tahfidz pt2
     INNER JOIN public.users u2 ON u2.id = pt2.user_id
     WHERE pt2.batch_id = p_batch_id
       AND pt2.selection_status = 'selected'
       AND pt2.user_id != u.id
       AND (
         u2.zona_waktu = u.zona_waktu OR
         pt2.main_time_slot IN (pt.main_time_slot, pt.backup_time_slot) OR
         pt2.backup_time_slot IN (pt.main_time_slot, pt.backup_time_slot)
       )
    )::INTEGER AS total_matches,
    -- Count zona_waktu matches
    (SELECT COUNT(*)
     FROM public.pendaftaran_tikrar_tahfidz pt2
     INNER JOIN public.users u2 ON u2.id = pt2.user_id
     WHERE pt2.batch_id = p_batch_id
       AND pt2.selection_status = 'selected'
       AND pt2.user_id != u.id
       AND u2.zona_waktu = u.zona_waktu
    )::INTEGER AS zona_waktu_matches,
    -- Count same juz matches
    (SELECT COUNT(*)
     FROM public.pendaftaran_tikrar_tahfidz pt2
     INNER JOIN public.users u2 ON u2.id = pt2.user_id
     LEFT JOIN public.juz_options jo2 ON jo2.code = pt2.chosen_juz
     WHERE pt2.batch_id = p_batch_id
       AND pt2.selection_status = 'selected'
       AND pt2.user_id != u.id
       AND jo2.juz_number = jo.juz_number
    )::INTEGER AS same_juz_matches,
    -- Count cross juz matches
    (SELECT COUNT(*)
     FROM public.pendaftaran_tikrar_tahfidz pt2
     INNER JOIN public.users u2 ON u2.id = pt2.user_id
     LEFT JOIN public.juz_options jo2 ON jo2.code = pt2.chosen_juz
     WHERE pt2.batch_id = p_batch_id
       AND pt2.selection_status = 'selected'
       AND pt2.user_id != u.id
       AND jo2.juz_number != jo.juz_number
       AND (
         u2.zona_waktu = u.zona_waktu OR
         pt2.main_time_slot IN (pt.main_time_slot, pt.backup_time_slot) OR
         pt2.backup_time_slot IN (pt.main_time_slot, pt.backup_time_slot)
       )
    )::INTEGER AS cross_juz_matches
  FROM public.users u
  INNER JOIN public.pendaftaran_tikrar_tahfidz pt ON pt.user_id = u.id
  LEFT JOIN public.juz_options jo ON jo.code = pt.chosen_juz
  WHERE pt.batch_id = p_batch_id
    AND pt.selection_status = 'selected'
  ORDER BY u.full_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to analyze halaqah availability by juz
CREATE OR REPLACE FUNCTION analyze_halaqah_availability_by_juz(p_batch_id UUID)
RETURNS TABLE (
  juz_code VARCHAR,
  juz_number INTEGER,
  juz_name VARCHAR,
  total_thalibah INTEGER,
  available_halaqah INTEGER,
  halaqah_details JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    jo.code AS juz_code,
    jo.juz_number AS juz_number,
    jo.name AS juz_name,
    -- Count thalibah for this juz
    (SELECT COUNT(*)
     FROM public.pendaftaran_tikrar_tahfidz pt
     WHERE pt.batch_id = p_batch_id
       AND pt.selection_status = 'selected'
       AND pt.chosen_juz = jo.code
    )::INTEGER AS total_thalibah,
    -- Count available halaqah for this juz
    (SELECT COUNT(DISTINCT h.id)
     FROM public.halaqah h
     INNER JOIN public.halaqah_class_types hct ON hct.halaqah_id = h.id
     WHERE h.batch_id = p_batch_id
       AND h.program_id IN (
         SELECT id FROM public.programs
         WHERE batch_id = p_batch_id
         AND (juz_selection::text LIKE '%' || jo.code::text || '%'
              OR juz_selection::text LIKE '%' || jo.juz_number::text || '%')
       )
       AND h.is_active = true
       AND hct.is_active = true
    )::INTEGER AS available_halaqah,
    -- Get halaqah details
    (SELECT JSONB_AGG(
       JSONB_BUILD_OBJECT(
         'id', h.id,
         'name', h.name,
         'class_type', hct.class_type,
         'current_students', hct.current_students,
         'max_students', hct.max_students,
         'available_slots', (hct.max_students - hct.current_students)
       )
     )
     FROM public.halaqah h
     INNER JOIN public.halaqah_class_types hct ON hct.halaqah_id = h.id
     WHERE h.batch_id = p_batch_id
       AND h.program_id IN (
         SELECT id FROM public.programs
         WHERE batch_id = p_batch_id
         AND (juz_selection::text LIKE '%' || jo.code::text || '%'
              OR juz_selection::text LIKE '%' || jo.juz_number::text || '%')
       )
       AND h.is_active = true
       AND hct.is_active = true
    ) AS halaqah_details
  FROM public.juz_options jo
  WHERE jo.is_active = true
    AND jo.juz_number IN (28, 29, 30) -- Only active juz for Tikrar Tahfidz
  ORDER BY jo.juz_number, jo.part;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION find_compatible_study_partners IS 'Returns compatible study partners with priority: zona_waktu first, then juz option > juz number > cross juz. Each category: main_time_slot > backup_time_slot';
COMMENT ON FUNCTION analyze_potential_matches IS 'Analyzes potential matching opportunities for all selected thalibah in a batch';
COMMENT ON FUNCTION analyze_halaqah_availability_by_juz IS 'Analyzes halaqah availability by juz option for a given batch';
