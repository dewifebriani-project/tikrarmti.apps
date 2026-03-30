-- =====================================================
-- TEMPORARY: Disable RLS on users table to test
-- This is ONLY for debugging - re-enable after finding the issue
-- =====================================================

-- Disable RLS temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Test direct query
SELECT count(*) FROM public.users;

-- Check RLS status
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';
