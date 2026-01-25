-- =====================================================
-- DIAGNOSE TASHIH RLS ISSUE
-- =====================================================
-- Run each section separately to identify the problem
-- =====================================================

-- =====================================================
-- 1. CHECK CURRENT RLS POLICIES ON TASHIH_RECORDS
-- =====================================================
SELECT
  tablename,
  policyname,
  permissive,
  roles::text,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'tashih_records'
ORDER BY policyname;

-- =====================================================
-- 2. CHECK IF RLS IS ENABLED
-- =====================================================
SELECT
  relname as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname IN ('tashih_records', 'jurnal_records');

-- =====================================================
-- 3. CHECK USER IDS MATCH (replace email with actual user)
-- =====================================================
-- Replace 'email@example.com' with the thalibah user's email
/*
SELECT
  'auth.users' as source,
  id as user_id,
  email
FROM auth.users
WHERE email = 'email@example.com'
UNION ALL
SELECT
  'public.users' as source,
  id as user_id,
  email
FROM public.users
WHERE email = 'email@example.com';
*/

-- =====================================================
-- 4. CHECK IF THERE ARE MULTIPLE INSERT POLICIES
-- =====================================================
SELECT
  policyname,
  cmd,
  with_check::text
FROM pg_policies
WHERE tablename = 'tashih_records'
AND cmd = 'INSERT';

-- =====================================================
-- 5. TEST INSERT SIMULATION (as the current user)
-- =====================================================
-- This will show if the insert would be allowed
/*
SELECT
  auth.uid() as current_user_id,
  EXISTS (
    SELECT 1
    WHERE auth.uid() = auth.uid()  -- This simulates the RLS check
  ) as insert_allowed;
*/

-- =====================================================
-- 6. CHECK GRANTS ON TABLE
-- =====================================================
SELECT
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'tashih_records'
AND table_schema = 'public';

-- =====================================================
-- 7. CHECK IF PUBLIC.USERS HAS SAME ID AS AUTH.USERS
-- =====================================================
-- This shows ALL users where IDs don't match (major problem!)
SELECT
  au.id as auth_id,
  au.email as auth_email,
  pu.id as public_id,
  pu.email as public_email,
  CASE WHEN au.id = pu.id THEN 'MATCH' ELSE 'MISMATCH!' END as status
FROM auth.users au
LEFT JOIN public.users pu ON au.email = pu.email
WHERE au.id != pu.id OR pu.id IS NULL
LIMIT 20;

-- =====================================================
-- 8. FIX: Align public.users IDs with auth.users IDs
-- =====================================================
-- CAUTION: Only run this if step 7 shows mismatches!
-- This updates public.users.id to match auth.users.id
/*
UPDATE public.users pu
SET id = au.id
FROM auth.users au
WHERE pu.email = au.email
AND pu.id != au.id;
*/

-- =====================================================
-- 9. SIMPLE TEST: Direct insert (should work for admin)
-- =====================================================
-- Test if basic insert works at all
/*
INSERT INTO public.tashih_records (user_id, blok, lokasi, waktu_tashih)
VALUES (auth.uid(), 'TEST', 'mti', NOW())
RETURNING id;
*/
