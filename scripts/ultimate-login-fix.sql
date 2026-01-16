-- ============================================================================
-- ULTIMATE LOGIN FIX - Disable RLS temporarily for troubleshooting
-- ============================================================================

-- 1. CHECK CURRENT RLS STATUS
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'pendaftaran_tikrar_tahfidz', 'daftar_ulang_submissions');

-- 2. LIST ALL CURRENT POLICIES
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles,
  qual
FROM pg_policies
WHERE tablename IN ('users', 'pendaftaran_tikrar_tahfidz', 'daftar_ulang_submissions')
ORDER BY tablename, policyname;

-- 3. CHECK IF THERE'S A POLICY FOR AUTHENTICATED USERS TO VIEW OWN PROFILE
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
  AND policyname LIKE '%view%'
  AND (roles = '{authenticated}' OR roles = '{public}');
