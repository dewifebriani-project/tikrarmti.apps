-- ============================================================================
-- Find halaqah that match juz 1A
-- ============================================================================

-- 1. Show all muallimah who can teach juz 1 or 1A
SELECT
  mr.user_id,
  u.full_name as muallimah_name,
  mr.preferred_juz,
  mr.class_type,
  mr.status,
  mr.batch_id
FROM muallimah_registrations mr
LEFT JOIN users u ON u.id = mr.user_id
WHERE mr.status = 'approved'
  AND (
    mr.preferred_juz LIKE '%1%'
    OR mr.preferred_juz IS NULL  -- NULL means teaches all juz
  )
ORDER BY mr.preferred_juz;

-- 2. Show all halaqah whose muallimah can teach juz 1 or 1A
SELECT
  h.id,
  h.name,
  h.status,
  h.preferred_juz as halaqah_preferred_juz,
  mr.preferred_juz as muallimah_preferred_juz,
  u.full_name as muallimah_name,
  h.muallimah_id
FROM halaqah h
LEFT JOIN muallimah_registrations mr ON mr.user_id = h.muallimah_id
LEFT JOIN users u ON u.id = h.muallimah_id
WHERE h.status = 'active'
  AND (
    mr.preferred_juz LIKE '%1%'
    OR mr.preferred_juz IS NULL
    OR h.preferred_juz LIKE '%1%'
    OR h.preferred_juz IS NULL
  );

-- 3. Count halaqah by juz filter logic (matching the API code)
-- For thalibah with final_juz = '1A'
SELECT
  h.id,
  h.name,
  h.preferred_juz as halaqah_preferred_juz,
  mr.preferred_juz as muallimah_preferred_juz,
  CASE
    WHEN mr.preferred_juz IS NULL AND h.preferred_juz IS NULL THEN 'YES - No juz restriction'
    WHEN mr.preferred_juz LIKE '%1A%' OR h.preferred_juz LIKE '%1A%' THEN 'YES - Exact match 1A'
    WHEN mr.preferred_juz LIKE '%1,%' OR mr.preferred_juz LIKE '%, 1,%' OR mr.preferred_juz LIKE '%, 1' OR mr.preferred_juz = '1' THEN 'YES - Matches 1'
    WHEN h.preferred_juz LIKE '%1,%' OR h.preferred_juz LIKE '%, 1,%' OR h.preferred_juz LIKE '%, 1' OR h.preferred_juz = '1' THEN 'YES - Matches 1'
    ELSE 'NO - Does not match'
  END as matches_1a
FROM halaqah h
LEFT JOIN muallimah_registrations mr ON mr.user_id = h.muallimah_id AND mr.status = 'approved'
WHERE h.status = 'active'
ORDER BY matches_1a DESC, h.name;
