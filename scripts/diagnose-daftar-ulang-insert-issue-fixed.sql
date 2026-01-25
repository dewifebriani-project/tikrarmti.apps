-- ============================================================================
-- Diagnose: daftar_ulang_submissions INSERT RLS error
-- This script helps diagnose why a user cannot insert into daftar_ulang_submissions
-- ============================================================================

-- 1. Check all RLS policies on daftar_ulang_submissions
SELECT
  '=== All RLS Policies ===' as section,
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  roles,
  qual as using_expr_raw,
  with_check as with_check_expr_raw
FROM pg_policies
WHERE tablename = 'daftar_ulang_submissions'
ORDER BY cmd, policyname;

-- 2. Check for restrictive policies (permissive = false)
-- Multiple restrictive policies require ALL to pass, not just one
SELECT
  '=== Restrictive Policies Check ===' as section,
  cmd,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ' ORDER BY policyname) as policies,
  BOOL_AND(permissive) as all_permissive,
  BOOL_AND(NOT permissive) as has_restrictive,
  CASE
    WHEN BOOL_AND(NOT permissive) THEN 'WARNING - Restrictive policies found! All must pass.'
    ELSE 'OK - All policies are permissive (any one can pass)'
  END as assessment
FROM pg_policies
WHERE tablename = 'daftar_ulang_submissions'
GROUP BY cmd;

-- 3. Test the INSERT policy condition with a sample user
-- Replace 'TEST_USER_ID_HERE' with actual UUID
DO $$
DECLARE
  v_test_user_id uuid := 'TEST_USER_ID_HERE'::uuid; -- REPLACE THIS
  v_test_registration_id uuid := 'TEST_REGISTRATION_ID_HERE'::uuid; -- REPLACE THIS
  v_policy_check boolean;
BEGIN
  -- Simulate the policy check: user_id = auth.uid()
  -- Assuming auth.uid() would return v_test_user_id
  SELECT (
    user_id = v_test_user_id
  ) INTO v_policy_check
  FROM (
    SELECT v_test_user_id as user_id
  ) dummy;

  RAISE NOTICE 'INSERT Policy Check for user %: %',
    v_test_user_id,
    CASE WHEN v_policy_check THEN 'PASS' ELSE 'FAIL' END;

  -- Check if registration exists and belongs to user
  IF EXISTS (
    SELECT 1 FROM pendaftaran_tikrar_tahfidz
    WHERE id = v_test_registration_id
      AND user_id = v_test_user_id
      AND selection_status = 'selected'
  ) THEN
    RAISE NOTICE 'Registration check: PASS - User owns this registration';
  ELSE
    RAISE NOTICE 'Registration check: FAIL - User does not own this registration';
  END IF;
END $$;

-- 4. Check if there are any existing submissions for test user
-- Replace 'TEST_USER_ID_HERE' with actual UUID
-- SELECT
--   'Existing submissions' as section,
--   id,
--   user_id,
--   registration_id,
--   status,
--   created_at
-- FROM daftar_ulang_submissions
-- WHERE user_id = 'TEST_USER_ID_HERE'::uuid; -- REPLACE THIS

-- 5. Check the table constraints that might cause issues
SELECT
  '=== Table Constraints ===' as section,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'daftar_ulang_submissions'::regclass
  AND contype != 'f' -- Exclude foreign keys for now
ORDER BY conname;

-- 6. Show foreign key constraints separately
SELECT
  '=== Foreign Key Constraints ===' as section,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'daftar_ulang_submissions'::regclass
  AND contype = 'f'
ORDER BY conname;

-- 7. Check if RLS is enabled
SELECT
  '=== RLS Status ===' as section,
  relname as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname = 'daftar_ulang_submissions';

-- 8. Sample INSERT test (commented out - run manually if needed)
-- This will fail if RLS blocks it
-- INSERT INTO daftar_ulang_submissions (
--   user_id,
--   registration_id,
--   batch_id,
--   confirmed_full_name,
--   confirmed_chosen_juz,
--   confirmed_main_time_slot,
--   confirmed_backup_time_slot,
--   partner_type,
--   status
-- ) VALUES (
--   'TEST_USER_ID_HERE'::uuid, -- REPLACE THIS
--   'TEST_REGISTRATION_ID_HERE'::uuid, -- REPLACE THIS
--   (SELECT batch_id FROM pendaftaran_tikrar_tahfidz WHERE id = 'TEST_REGISTRATION_ID_HERE'::uuid), -- REPLACE THIS
--   'Test Name',
--   '29A',
--   '06-09',
--   '09-12',
--   'self_match',
--   'draft'
-- );

-- 9. Check actual RLS policy expressions using pg_get_expr with table OID
SELECT
  '=== Policy Expressions (Decoded) ===' as section,
  policyname,
  cmd,
  permissive,
  pg_get_expr(qual, 'daftar_ulang_submissions'::regclass) as using_expression,
  pg_get_expr(with_check, 'daftar_ulang_submissions'::regclass) as with_check_expression
FROM pg_policies
WHERE tablename = 'daftar_ulang_submissions'
ORDER BY cmd, policyname;
