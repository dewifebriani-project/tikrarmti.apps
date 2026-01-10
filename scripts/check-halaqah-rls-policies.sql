-- ============================================================================
-- Check RLS Policies on halaqah table
-- ============================================================================

-- 1. Check if RLS is enabled on halaqah table
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'halaqah';

-- 2. List all policies on halaqah table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'halaqah';

-- 3. Check if RLS is enabled on muallimah_registrations table
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'muallimah_registrations';

-- 4. List all policies on muallimah_registrations table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'muallimah_registrations';

-- 5. Test query as authenticated user (simulate what API does)
-- Run this after setting session user to an authenticated user
SELECT COUNT(*) as halaqah_count
FROM halaqah
WHERE status = 'active';

-- 6. Test muallimah_registrations access
SELECT COUNT(*) as muallimah_reg_count
FROM muallimah_registrations
WHERE status = 'approved';
