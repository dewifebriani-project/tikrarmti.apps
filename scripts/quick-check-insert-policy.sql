-- ============================================================================
-- Quick Check: Does the INSERT policy for regular users exist?
-- ============================================================================

-- Check if the policy "Users can insert own daftar ulang" exists
SELECT
  policyname,
  cmd,
  permissive::text as permissive,
  with_check
FROM pg_policies
WHERE tablename = 'daftar_ulang_submissions'
  AND cmd = 'INSERT';

-- If the result is empty or doesn't show "user_id = auth.uid()", then the policy is missing!
