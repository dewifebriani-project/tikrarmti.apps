-- ============================================================================
-- Check existing submission for dewifebriani@tazkia.ac.id
-- ============================================================================

-- Get the existing submission details
WITH user_info AS (
  SELECT
    u.id as user_id,
    u.email,
    p.id as registration_id,
    p.full_name as registration_name,
    p.selection_status,
    p.re_enrollment_completed
  FROM users u
  INNER JOIN pendaftaran_tikrar_tahfidz p ON p.user_id = u.id
  WHERE u.email = 'dewifebriani@tazkia.ac.id'
    AND p.selection_status = 'selected'
  LIMIT 1
)
SELECT
  s.id,
  s.user_id,
  s.registration_id,
  s.status as submission_status,
  s.submitted_at,
  s.reviewed_at,
  s.partner_type,
  s.ujian_halaqah_id,
  s.tashih_halaqah_id,
  ui.email,
  ui.registration_name,
  ui.re_enrollment_completed
FROM user_info ui
INNER JOIN daftar_ulang_submissions s ON s.id = 'dcc1f887-eacd-414e-8aa6-7b35e1464729'
  OR (s.user_id = ui.user_id AND s.registration_id = ui.registration_id);

-- Check all submissions for this user
WITH user_info AS (
  SELECT id, email FROM users WHERE email = 'dewifebriani@tazkia.ac.id'
)
SELECT
  s.id,
  s.registration_id,
  s.status,
  s.submitted_at,
  s.created_at,
  s.updated_at
FROM user_info ui
INNER JOIN daftar_ulang_submissions s ON s.user_id = ui.id
ORDER BY s.created_at DESC;

-- Summary
SELECT
  '=== SUMMARY ===' as section,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM daftar_ulang_submissions s
      INNER JOIN users u ON u.id = s.user_id
      WHERE u.email = 'dewifebriani@tazkia.ac.id'
        AND s.status = 'draft'
    ) THEN 'Has DRAFT submission - can be updated'
    WHEN EXISTS (
      SELECT 1 FROM daftar_ulang_submissions s
      INNER JOIN users u ON u.id = s.user_id
      WHERE u.email = 'dewifebriani@tazkia.ac.id'
        AND s.status = 'submitted'
    ) THEN 'Has SUBMITTED submission - cannot create new one'
    ELSE 'No submission found'
  END as status;
