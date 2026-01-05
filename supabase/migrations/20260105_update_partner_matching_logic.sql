-- ============================================================================
-- Migration: Update partner matching logic to show all same time slot
-- Created: 2026-01-05
-- Description: Updates find_compatible_study_partners function to show ALL
--              thalibah with matching time slot, not just matching juz.
--              Gives higher score (100) if both juz and time match,
--              lower score (60) if only time matches.
-- ============================================================================

CREATE OR REPLACE FUNCTION find_compatible_study_partners(
  p_user_id UUID,
  p_batch_id UUID,
  p_time_slot VARCHAR,
  p_juz VARCHAR
)
RETURNS TABLE (
  partner_id UUID,
  partner_name VARCHAR,
  partner_juz VARCHAR,
  partner_time_slot VARCHAR,
  match_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id AS partner_id,
    u.full_name::VARCHAR AS partner_name,
    pt.chosen_juz::VARCHAR AS partner_juz,
    pt.main_time_slot::VARCHAR AS partner_time_slot,
    -- Calculate match score
    CASE
      -- Perfect match: same juz and same time slot
      WHEN pt.chosen_juz = p_juz AND pt.main_time_slot = p_time_slot THEN 100
      -- Good match: same time slot (main or backup)
      WHEN pt.main_time_slot = p_time_slot OR pt.backup_time_slot = p_time_slot THEN 60
      -- Partial match: same juz but different time
      WHEN pt.chosen_juz = p_juz THEN 40
      ELSE 0
    END AS match_score
  FROM public.users u
  INNER JOIN public.pendaftaran_tikrar_tahfidz pt ON pt.user_id = u.id
  WHERE pt.batch_id = p_batch_id
    AND pt.selection_status = 'selected'
    AND u.id != p_user_id
    -- Show ALL thalibah with matching time slot (main or backup)
    AND (
      pt.main_time_slot = p_time_slot OR
      pt.backup_time_slot = p_time_slot
    )
    -- Not already partnered (no mutual partnership)
    AND NOT EXISTS (
      SELECT 1 FROM public.study_partner_preferences spp
      WHERE spp.user_id = u.id
        AND spp.partner_status = 'mutual'
    )
  ORDER BY match_score DESC, u.full_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION find_compatible_study_partners IS 'Returns compatible study partners prioritizing same time slot, with bonus for matching juz';
