-- FINAL CLEAN: Remove ALL UPDATE policies and create ONE clean policy
-- This will fix the duplicate/conflicting policies issue

-- Drop BOTH existing UPDATE policies
DROP POLICY IF EXISTS "Users can update oral submission" ON public.pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "allow_user_update_own_tikrar" ON public.pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Users can update own registration" ON public.pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Users can update their own registration" ON public.pendaftaran_tikrar_tahfidz;

-- Create ONE simple, permissive UPDATE policy
-- This allows users to update their own records regardless of status
CREATE POLICY "allow_user_update_own_tikrar"
ON public.pendaftaran_tikrar_tahfidz
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Verify - should show ONLY ONE UPDATE policy
SELECT
    tablename,
    policyname,
    cmd,
    roles::text,
    qual::text as using_clause,
    with_check::text
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'pendaftaran_tikrar_tahfidz'
  AND cmd = 'UPDATE'
ORDER BY policyname;

-- Success message
DO $$
DECLARE
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'pendaftaran_tikrar_tahfidz'
    AND cmd = 'UPDATE';

  IF policy_count = 1 THEN
    RAISE NOTICE '✅ SUCCESS! Exactly 1 UPDATE policy exists';
    RAISE NOTICE 'Policy: allow_user_update_own_tikrar';
    RAISE NOTICE 'Allows: auth.uid() = user_id (works for ALL statuses)';
  ELSE
    RAISE WARNING '⚠️  WARNING! Found % UPDATE policies (expected 1)', policy_count;
  END IF;
END $$;
