-- Migration: Fix daftar_ulang_submissions UPDATE policy to allow draft -> submitted transition
-- This allows users to submit their draft by updating the status to 'submitted'

-- Drop the existing restrictive UPDATE policy
DROP POLICY IF EXISTS "Users can update own draft daftar ulang" ON public.daftar_ulang_submissions;

-- Create a more flexible UPDATE policy
-- Users can UPDATE their own submission, but can only CREATE drafts (status = 'draft')
-- This allows the transition from draft -> submitted
CREATE POLICY "Users can update own daftar ulang"
  ON public.daftar_ulang_submissions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      -- Can update to draft (initial creation or modification)
      status = 'draft'
      OR
      -- Can update from draft to submitted (submission)
      (status = 'submitted' AND (SELECT status FROM daftar_ulang_submissions WHERE id = daftar_ulang_submissions.id LIMIT 1) = 'draft')
    )
  );
