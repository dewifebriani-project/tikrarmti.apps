-- ============================================================================
-- Get the DRAFT submission details for dewifebriani@tazkia.ac.id
-- ============================================================================

-- Get the draft submission
WITH user_info AS (
  SELECT id, email FROM users WHERE email = 'dewifebriani@tazkia.ac.id'
)
SELECT
  s.id as submission_id,
  s.user_id,
  s.registration_id,
  s.status,
  s.partner_type,
  s.ujian_halaqah_id,
  s.tashih_halaqah_id,
  s.confirmed_full_name,
  s.confirmed_chosen_juz,
  s.confirmed_main_time_slot,
  s.confirmed_backup_time_slot,
  s.akad_files,
  s.created_at,
  s.updated_at,
  s.submitted_at
FROM user_info ui
INNER JOIN daftar_ulang_submissions s ON s.user_id = ui.id
WHERE s.status = 'draft'
ORDER BY s.created_at DESC
LIMIT 1;

-- Solution: Update the draft to 'submitted' status instead of creating new
-- UPDATE daftar_ulang_submissions
-- SET
--   status = 'submitted',
--   submitted_at = NOW(),
--   updated_at = NOW()
-- WHERE id = 'THE_SUBMISSION_ID_FROM_ABOVE'
--   AND user_id = (SELECT id FROM users WHERE email = 'dewifebriani@tazkia.ac.id');
