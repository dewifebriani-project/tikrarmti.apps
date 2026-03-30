-- =====================================================
-- EMERGENCY FIX: Disable RLS temporarily for users table
-- Service role should bypass RLS, but something is blocking it
-- =====================================================

-- Check current RLS status
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';

-- Option 1: Temporarily disable RLS (NOT RECOMMENDED for production)
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Option 2: Create a policy that allows service role to bypass everything
DROP POLICY IF EXISTS users_service_bypass ON public.users;

CREATE POLICY users_service_bypass ON public.users
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Verify
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users';

-- Test with service role simulation
SET ROLE postgres;
SELECT count(*) as service_role_can_see
FROM public.users;
RESET ROLE;
