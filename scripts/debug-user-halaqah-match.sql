-- ============================================================================
-- Debug: Check why specific user cannot see any halaqah
-- Replace 'USER_EMAIL_HERE' with the actual email
-- ============================================================================

-- 1. Get user's registration info and calculate final_juz
WITH user_info AS (
  SELECT
    u.id as user_id,
    u.email,
    p.chosen_juz,
    p.exam_score,
    p.batch_id,
    -- Calculate final_juz (same logic as API)
    CASE
      WHEN p.exam_score IS NOT NULL AND p.exam_score < 70 THEN
        CASE
          WHEN UPPER(p.chosen_juz) IN ('28A', '28B', '28') THEN '29A'
          WHEN UPPER(p.chosen_juz) IN ('1A', '1B', '29A', '29B', '29', '1') THEN '30A'
          ELSE UPPER(p.chosen_juz)
        END
      ELSE UPPER(p.chosen_juz)
    END as final_juz
  FROM users u
  INNER JOIN pendaftaran_tikrar_tahfidz p ON p.user_id = u.id
  WHERE u.email = 'USER_EMAIL_HERE'  -- REPLACE THIS
    AND p.selection_status = 'selected'
  ORDER BY p.created_at DESC
  LIMIT 1
)
-- 2. Show user info
SELECT * FROM user_info;

-- 3. Find ALL halaqah and check if they match user's final_juz
WITH user_info AS (
  SELECT
    u.id as user_id,
    u.email,
    p.chosen_juz,
    p.exam_score,
    p.batch_id,
    CASE
      WHEN p.exam_score IS NOT NULL AND p.exam_score < 70 THEN
        CASE
          WHEN UPPER(p.chosen_juz) IN ('28A', '28B', '28') THEN '29A'
          WHEN UPPER(p.chosen_juz) IN ('1A', '1B', '29A', '29B', '29', '1') THEN '30A'
          ELSE UPPER(p.chosen_juz)
        END
      ELSE UPPER(p.chosen_juz)
    END as final_juz
  FROM users u
  INNER JOIN pendaftaran_tikrar_tahfidz p ON p.user_id = u.id
  WHERE u.email = 'USER_EMAIL_HERE'  -- REPLACE THIS
    AND p.selection_status = 'selected'
  ORDER BY p.created_at DESC
  LIMIT 1
)
SELECT
  h.id,
  h.name,
  h.status,
  h.preferred_juz as halaqah_preferred_juz,
  mr.preferred_juz as muallimah_preferred_juz,
  COALESCE(mr.preferred_juz, h.preferred_juz) as effective_juz,
  ui.final_juz as user_final_juz,
  -- Check if matches (same logic as API)
  CASE
    WHEN COALESCE(mr.preferred_juz, h.preferred_juz) IS NULL THEN 'YES - No restriction'
    WHEN COALESCE(mr.preferred_juz, h.preferred_juz) LIKE '%' || ui.final_juz || '%' THEN 'YES - Exact match'
    WHEN ui.final_juz LIKE COALESCE(mr.preferred_juz, h.preferred_juz) || '%' THEN 'YES - Prefix match'
    WHEN COALESCE(mr.preferred_juz, h.preferred_juz) LIKE ui.final_juz || '%' THEN 'YES - Prefix match reverse'
    ELSE 'NO - Does not match'
  END as matches
FROM halaqah h
CROSS JOIN user_info ui
LEFT JOIN muallimah_registrations mr ON mr.user_id = h.muallimah_id
  AND mr.batch_id = ui.batch_id
  AND mr.status = 'approved'
WHERE h.status = 'active'
ORDER BY matches DESC, h.name;

-- 4. Count how many halaqah match
WITH user_info AS (
  SELECT
    u.id as user_id,
    u.email,
    p.batch_id,
    CASE
      WHEN p.exam_score IS NOT NULL AND p.exam_score < 70 THEN
        CASE
          WHEN UPPER(p.chosen_juz) IN ('28A', '28B', '28') THEN '29A'
          WHEN UPPER(p.chosen_juz) IN ('1A', '1B', '29A', '29B', '29', '1') THEN '30A'
          ELSE UPPER(p.chosen_juz)
        END
      ELSE UPPER(p.chosen_juz)
    END as final_juz
  FROM users u
  INNER JOIN pendaftaran_tikrar_tahfidz p ON p.user_id = u.id
  WHERE u.email = 'USER_EMAIL_HERE'  -- REPLACE THIS
    AND p.selection_status = 'selected'
  ORDER BY p.created_at DESC
  LIMIT 1
)
SELECT
  COUNT(*) as total_matching_halaqah
FROM halaqah h
CROSS JOIN user_info ui
LEFT JOIN muallimah_registrations mr ON mr.user_id = h.muallimah_id
  AND mr.batch_id = ui.batch_id
  AND mr.status = 'approved'
WHERE h.status = 'active'
  AND (
    COALESCE(mr.preferred_juz, h.preferred_juz) IS NULL
    OR COALESCE(mr.preferred_juz, h.preferred_juz) LIKE '%' || ui.final_juz || '%'
    OR ui.final_juz LIKE COALESCE(mr.preferred_juz, h.preferred_juz) || '%'
    OR COALESCE(mr.preferred_juz, h.preferred_juz) LIKE ui.final_juz || '%'
  );
