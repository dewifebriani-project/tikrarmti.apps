-- ============================================================================
-- Check SELECT policy on daftar_ulang_submissions
-- ============================================================================

-- 1. Show all SELECT policies
SELECT
  '=== SELECT POLICIES ===' as section,
  policyname,
  permissive::text as permissive,
  qual as using_clause
FROM pg_policies
WHERE tablename = 'daftar_ulang_submissions'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- 2. Test if user can SELECT their own submissions
-- This simulates what the app does at line 215-220 of actions.ts
DO $$
DECLARE
  v_user_id uuid;
  v_registration_id uuid;
  v_existing_count integer;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE email = 'dewifebriani@tazkia.ac.id';
  SELECT id INTO v_registration_id FROM pendaftaran_tikrar_tahfidz WHERE user_id = v_user_id AND selection_status = 'selected' LIMIT 1;

  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Registration ID: %', v_registration_id;
  RAISE NOTICE '';

  -- Test the SELECT query (same as in actions.ts)
  RAISE NOTICE 'Testing SELECT query (same as actions.ts line 215-220)...';

  SELECT COUNT(*) INTO v_existing_count
  FROM daftar_ulang_submissions
  WHERE user_id = v_user_id
    AND registration_id = v_registration_id;

  RAISE NOTICE 'Found % existing submission(s)', v_existing_count;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SELECT FAILED: %', SQLERRM;
  RAISE NOTICE 'SQLSTATE: %', SQLSTATE;

  IF SQLSTATE = '42501' THEN
    RAISE NOTICE '';
    RAISE NOTICE '🔴 CRITICAL ISSUE FOUND!';
    RAISE NOTICE 'User cannot SELECT from daftar_ulang_submissions!';
    RAISE NOTICE 'This means the existing check in actions.ts will fail.';
    RAISE NOTICE 'The app will try to INSERT instead of UPDATE.';
    RAISE NOTICE 'This causes the UNIQUE constraint violation.';
  END IF;
END $$;

-- 3. Check what the SELECT policy actually allows
SELECT
  '=== SELECT POLICY ANALYSIS ===' as section,
  policyname,
  qual,
  CASE
    WHEN qual::text LIKE '%user_id = auth.uid()%' THEN 'Checks user_id = auth.uid() - CORRECT'
    WHEN qual::text LIKE '%admin%' THEN 'Admin policy'
    WHEN qual IS NULL THEN 'No USING clause - allows all SELECTs'
    ELSE 'Other condition'
  END as policy_type
FROM pg_policies
WHERE tablename = 'daftar_ulang_submissions'
  AND cmd = 'SELECT';
