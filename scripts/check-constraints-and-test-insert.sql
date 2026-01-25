-- ============================================================================
-- Check constraints and test INSERT for daftar_ulang_submissions
-- ============================================================================

-- 1. Check all constraints (except foreign keys)
SELECT
  conname as constraint_name,
  contype as constraint_type,
  CASE contype
    WHEN 'c' THEN 'CHECK'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'x' THEN 'EXCLUSION'
  END as constraint_type_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'daftar_ulang_submissions'::regclass
ORDER BY contype, conname;

-- 2. Check the UNIQUE constraint specifically
-- This could be causing issues if user tries to insert duplicate
SELECT
  conname as unique_constraint,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'daftar_ulang_submissions'::regclass
  AND contype = 'u';

-- 3. Check if there are existing submissions (could be blocking due to UNIQUE constraint)
SELECT
  'Existing submissions that might block INSERT' as info,
  COUNT(*) as total_submissions,
  COUNT(DISTINCT user_id) as unique_users
FROM daftar_ulang_submissions;

-- 4. Check for a specific user (dewifebriani@tazkia.ac.id)
WITH user_check AS (
  SELECT
    u.id as user_id,
    u.email,
    p.id as registration_id,
    p.batch_id,
    s.id as existing_submission_id
  FROM users u
  INNER JOIN pendaftaran_tikrar_tahfidz p ON p.user_id = u.id
  LEFT JOIN daftar_ulang_submissions s ON s.user_id = u.id AND s.registration_id = p.id
  WHERE u.email = 'dewifebriani@tazkia.ac.id'
    AND p.selection_status = 'selected'
  LIMIT 1
)
SELECT
  user_id,
  email,
  registration_id,
  batch_id,
  existing_submission_id,
  CASE
    WHEN existing_submission_id IS NOT NULL THEN 'WARNING: Submission already exists! UNIQUE constraint will block new INSERT.'
    ELSE 'OK: No existing submission, INSERT should work.'
  END as insert_status
FROM user_check;

-- 5. Test INSERT with minimal data (to isolate the issue)
-- This will help identify if it's a data problem or RLS problem
-- Uncomment to test:
--
-- DO $$
-- DECLARE
--   v_test_user_id uuid := (SELECT id FROM users WHERE email = 'dewifebriani@tazkia.ac.id' LIMIT 1);
--   v_test_reg_id uuid := (SELECT id FROM pendaftaran_tikrar_tahfidz WHERE user_id = v_test_user_id AND selection_status = 'selected' LIMIT 1);
--   v_test_batch_id uuid := (SELECT batch_id FROM pendaftaran_tikrar_tahfidz WHERE id = v_test_reg_id);
-- BEGIN
--   RAISE NOTICE 'Testing INSERT for user: %', v_test_user_id;
--   RAISE NOTICE 'Registration: %', v_test_reg_id;
--   RAISE NOTICE 'Batch: %', v_test_batch_id;
--
--   INSERT INTO daftar_ulang_submissions (
--     user_id,
--     registration_id,
--     batch_id,
--     confirmed_full_name,
--     confirmed_chosen_juz,
--     confirmed_main_time_slot,
--     confirmed_backup_time_slot,
--     partner_type,
--     status
--   ) VALUES (
--     v_test_user_id,
--     v_test_reg_id,
--     v_test_batch_id,
--     'Test Name',
--     '29A',
--     '06-09',
--     '09-12',
--     'self_match',
--     'draft'
--   );
--
--   RAISE NOTICE 'INSERT SUCCESSFUL!';
--
-- EXCEPTION WHEN OTHERS THEN
--   RAISE NOTICE 'INSERT FAILED: %', SQLERRM;
--   RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
-- END $$;
