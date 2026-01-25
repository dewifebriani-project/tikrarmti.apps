-- Fix RLS policy for pendaftaran_tikrar_tahfidz to allow oral submission updates
-- The issue: Users can INSERT their registration but cannot UPDATE oral_submission fields

-- First, check current policies
SELECT tablename, policyname, cmd, roles::text, qual::text as using_clause, with_check::text
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'pendaftaran_tikrar_tahfidz'
ORDER BY cmd, policyname;

-- The user needs UPDATE permission on their own registration
-- Drop existing update policies if they're too restrictive
DROP POLICY IF EXISTS "Users can update own registration" ON public.pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Users can update their own registration" ON public.pendaftaran_tikrar_tahfidz;

-- Create permissive UPDATE policy for users to update their own oral submission
CREATE POLICY "Users can update oral submission"
ON public.pendaftaran_tikrar_tahfidz
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Verify the new policy
SELECT tablename, policyname, cmd, roles::text, qual::text as using_clause, with_check::text
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'pendaftaran_tikrar_tahfidz'
  AND cmd = 'UPDATE'
ORDER BY policyname;
