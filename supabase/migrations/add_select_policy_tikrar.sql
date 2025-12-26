-- Add SELECT policy for pendaftaran_tikrar_tahfidz
-- This is needed for users to READ their own registration data

-- Drop existing SELECT policy if any
DROP POLICY IF EXISTS "Users can view own registration" ON public.pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Users can view their own registration" ON public.pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "allow_user_select_own_tikrar" ON public.pendaftaran_tikrar_tahfidz;

-- Create SELECT policy
CREATE POLICY "allow_user_select_own_tikrar"
ON public.pendaftaran_tikrar_tahfidz
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Verify policies
SELECT
    '=== POLICIES AFTER UPDATE ===' as section,
    policyname,
    cmd,
    roles::text,
    qual::text as using_clause,
    with_check::text
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'pendaftaran_tikrar_tahfidz'
ORDER BY cmd, policyname;

-- Test query as user would see it
-- This should now return data for user c862c410-0bee-4ac6-a3ca-53ac5b97277c
SELECT
    '=== TEST DATA (simulated) ===' as section,
    COUNT(*) as total_records
FROM public.pendaftaran_tikrar_tahfidz
WHERE user_id = 'c862c410-0bee-4ac6-a3ca-53ac5b97277c';
