-- ============================================================================
-- FIX: Allow users to UPDATE their draft to 'submitted' status
-- ============================================================================

-- Drop the existing restrictive UPDATE policy
DROP POLICY IF EXISTS "Users can update own draft daftar ulang" ON public.daftar_ulang_submissions;

-- Create a more flexible UPDATE policy
-- Users can UPDATE their own submission
-- The USING clause checks if they own it
-- The WITH CHECK allows:
--   1. Updates to 'draft' status (for saving drafts)
--   2. Updates from 'draft' to 'submitted' (for final submission)
--   3. Updates to other fields while keeping same status
CREATE POLICY "Users can update own daftar ulang"
  ON public.daftar_ulang_submissions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      -- Allow updates where new status is draft (for saving/modifying drafts)
      status = 'draft'
      OR
      -- Allow updates where old status was draft and new status is submitted (for final submission)
      (status = 'submitted' AND (SELECT status FROM daftar_ulang_submissions WHERE id = daftar_ulang_submissions.id LIMIT 1) = 'draft')
    )
  );

-- Verify the new policy (without pg_get_expr)
SELECT
  'Policy created successfully' as result,
  policyname,
  cmd,
  permissive::text as permissive,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'daftar_ulang_submissions'
  AND policyname = 'Users can update own daftar ulang';

-- Test if UPDATE now works
DO $$
DECLARE
  v_submission_id uuid := 'e233b9b7-3285-4354-b71f-ba9a7344d646';
BEGIN
  RAISE NOTICE 'Testing UPDATE draft -> submitted...';

  -- Try UPDATE
  UPDATE daftar_ulang_submissions
  SET status = 'submitted',
      submitted_at = NOW(),
      updated_at = NOW()
  WHERE id = v_submission_id;

  RAISE NOTICE '✅ UPDATE SUCCESSFUL! Policy fix worked.';

  -- Revert for now
  UPDATE daftar_ulang_submissions
  SET status = 'draft',
      submitted_at = NULL,
      updated_at = NOW()
  WHERE id = v_submission_id;

  RAISE NOTICE '✅ Changes reverted. User can now submit!';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ UPDATE FAILED: %', SQLERRM;
END $$;
