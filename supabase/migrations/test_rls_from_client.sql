-- Test RLS policy by simulating client query
-- This will test if SELECT policy allows reading the record

-- 1. First verify the record exists (as admin/service role)
SELECT
    '=== RECORD EXISTS (service role) ===' as section,
    id,
    user_id,
    email,
    full_name,
    status,
    oral_submission_url
FROM public.pendaftaran_tikrar_tahfidz
WHERE user_id = 'c862c410-0bee-4ac6-a3ca-53ac5b97277c';

-- 2. Check what SELECT policies exist
SELECT
    '=== SELECT POLICIES ===' as section,
    policyname,
    cmd,
    roles::text,
    qual::text as using_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'pendaftaran_tikrar_tahfidz'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- 3. Check ALL policies on this table
SELECT
    '=== ALL POLICIES ===' as section,
    policyname,
    cmd,
    roles::text,
    qual::text as using_clause,
    with_check::text
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'pendaftaran_tikrar_tahfidz'
ORDER BY cmd, policyname;

-- 4. Check if RLS is enabled
SELECT
    '=== RLS STATUS ===' as section,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'pendaftaran_tikrar_tahfidz';
