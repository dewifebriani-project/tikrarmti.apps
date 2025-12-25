-- Fix: Allow users to update oral submission fields even after approval
-- The issue: Policy only allows UPDATE when status='pending', but approved users can't submit oral recordings

-- Drop the restrictive policy
DROP POLICY IF EXISTS "allow_user_update_own_tikrar" ON public.pendaftaran_tikrar_tahfidz;

-- Create new policy that allows users to update their oral submission
-- regardless of registration status
CREATE POLICY "allow_user_update_own_tikrar"
ON public.pendaftaran_tikrar_tahfidz
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  -- Users can only update these specific fields after approval:
  -- oral_submission_url, oral_submission_file_name, oral_submitted_at
  -- written_quiz_answers, written_quiz_score, etc.
  -- All other fields should not be changed after approval (enforced in application)
);

-- Verify the policy
SELECT tablename, policyname, cmd, roles::text,
       qual::text as using_clause,
       with_check::text
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'pendaftaran_tikrar_tahfidz'
  AND policyname = 'allow_user_update_own_tikrar';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Policy updated successfully! Users can now update oral submissions even after approval.';
END $$;
