-- ============================================================================
-- FIX: Remove infinite recursion from UPDATE policy
-- ============================================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can update own daftar ulang" ON public.daftar_ulang_submissions;

-- Create a simpler UPDATE policy without self-reference
-- This allows users to update their own submissions
CREATE POLICY "Users can update own daftar ulang"
  ON public.daftar_ulang_submissions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
  );

-- Verify the new policy
SELECT
  'Policy created' as result,
  policyname,
  cmd,
  permissive::text as permissive,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'daftar_ulang_submissions'
  AND policyname = 'Users can update own daftar ulang';

-- Test UPDATE
DO $$
DECLARE
  v_submission_id uuid := 'e233b9b7-3285-4354-b71f-ba9a7344d646';
BEGIN
  RAISE NOTICE 'Testing UPDATE draft -> submitted...';

  UPDATE daftar_ulang_submissions
  SET status = 'submitted',
      submitted_at = NOW()
  WHERE id = v_submission_id;

  RAISE NOTICE '✅ UPDATE SUCCESSFUL!';

  -- Revert
  UPDATE daftar_ulang_submissions
  SET status = 'draft',
      submitted_at = NULL
  WHERE id = v_submission_id;

  RAISE NOTICE '✅ Test passed. User can now submit!';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Error: %', SQLERRM;
END $$;
