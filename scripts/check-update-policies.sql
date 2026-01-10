-- ============================================================================
-- Check UPDATE policies on daftar_ulang_submissions
-- ============================================================================

-- Show all UPDATE policies
SELECT
  '=== ALL UPDATE POLICIES ===' as section,
  policyname,
  permissive::text as permissive,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'daftar_ulang_submissions'
  AND cmd = 'UPDATE'
ORDER BY policyname;

-- Check if the UPDATE policy for regular users requires status = 'draft'
SELECT
  '=== UPDATE POLICY ANALYSIS ===' as section,
  policyname,
  permissive::text as permissive,
  CASE
    WHEN with_check::text LIKE '%status = %draft%' THEN 'Requires status = draft'
    WHEN with_check::text LIKE '%status = %submitted%' THEN 'Requires status = submitted'
    WHEN with_check::text LIKE '%auth.uid()%' THEN 'Checks auth.uid()'
    ELSE 'Other condition'
  END as policy_analysis,
  with_check
FROM pg_policies
WHERE tablename = 'daftar_ulang_submissions'
  AND cmd = 'UPDATE'
  AND policyname NOT LIKE '%Admin%';

-- Test: Can we UPDATE a draft submission?
DO $$
DECLARE
  v_submission_id uuid := 'e233b9b7-3285-4354-b71f-ba9a7344d646';
  v_current_uid uuid := auth.uid();
BEGIN
  RAISE NOTICE 'Testing UPDATE...';
  RAISE NOTICE 'Submission ID: %', v_submission_id;
  RAISE NOTICE 'auth.uid(): %', COALESCE(v_current_uid::text, 'NULL');
  RAISE NOTICE '';

  -- Try UPDATE (same as what the app does)
  UPDATE daftar_ulang_submissions
  SET status = 'submitted',
      submitted_at = NOW(),
      updated_at = NOW()
  WHERE id = v_submission_id;

  RAISE NOTICE '✅ UPDATE SUCCESSFUL!';

  -- Revert the change
  UPDATE daftar_ulang_submissions
  SET status = 'draft',
      submitted_at = NULL,
      updated_at = NOW()
  WHERE id = v_submission_id;

  RAISE NOTICE '✅ Changes reverted.';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '';
  RAISE NOTICE '❌ UPDATE FAILED!';
  RAISE NOTICE 'Error: %', SQLERRM;
  RAISE NOTICE 'SQLSTATE: %', SQLSTATE;

  IF SQLSTATE = '42501' THEN
    RAISE NOTICE '';
    RAISE NOTICE '🔴 RLS violation on UPDATE!';
    RAISE NOTICE 'The UPDATE policy is blocking the operation.';
    RAISE NOTICE 'Check if the policy requires specific conditions.';
  END IF;
END $$;
