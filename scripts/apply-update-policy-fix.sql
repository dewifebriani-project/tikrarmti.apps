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

-- Verify the new policy
SELECT
  'Updated policy created' as result,
  policyname,
  cmd,
  permissive::text as permissive,
  pg_get_expr(qual, 'daftar_ulang_submissions'::regclass) as using_expr,
  pg_get_expr(with_check, 'daftar_ulang_submissions'::regclass) as with_check_expr
FROM pg_policies
WHERE tablename = 'daftar_ulang_submissions'
  AND policyname = 'Users can update own daftar ulang';
