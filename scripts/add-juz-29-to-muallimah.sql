-- ============================================================================
-- Add Juz 29 to Muallimah Preferred Juz
-- Solution for users with final_juz = 29A who cannot see any halaqah
-- ============================================================================

-- OPTION 1: Add juz 29 to muallimah who already teach juz 30
-- Rationale: Juz 29 and 30 are close, muallimah can handle both

-- Preview which muallimah will be updated
SELECT
  user_id,
  preferred_juz,
  preferred_juz || ', 29' as new_preferred_juz,
  class_type,
  status
FROM muallimah_registrations
WHERE status = 'approved'
  AND preferred_juz LIKE '%30%'
  AND preferred_juz NOT LIKE '%29%'
  AND batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49';

-- Execute update (UNCOMMENT after reviewing above)
-- UPDATE muallimah_registrations
-- SET preferred_juz = preferred_juz || ', 29'
-- WHERE status = 'approved'
--   AND preferred_juz LIKE '%30%'
--   AND preferred_juz NOT LIKE '%29%'
--   AND batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49';


-- OPTION 2: Add juz 29 to muallimah who already teach juz 28
-- Rationale: Juz 28 and 29 are sequential

-- Preview
SELECT
  user_id,
  preferred_juz,
  preferred_juz || ', 29' as new_preferred_juz,
  class_type,
  status
FROM muallimah_registrations
WHERE status = 'approved'
  AND preferred_juz LIKE '%28%'
  AND preferred_juz NOT LIKE '%29%'
  AND batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49';

-- Execute update (UNCOMMENT after reviewing above)
-- UPDATE muallimah_registrations
-- SET preferred_juz = preferred_juz || ', 29'
-- WHERE status = 'approved'
--   AND preferred_juz LIKE '%28%'
--   AND preferred_juz NOT LIKE '%29%'
--   AND batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49';


-- VERIFY: Check count of halaqah that will now match juz 29
SELECT COUNT(*) as halaqah_with_juz_29_or_30
FROM halaqah h
INNER JOIN muallimah_registrations mr ON mr.user_id = h.muallimah_id
WHERE h.status = 'active'
  AND mr.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49'
  AND (mr.preferred_juz LIKE '%29%' OR mr.preferred_juz LIKE '%30%' OR mr.preferred_juz LIKE '%28%');
