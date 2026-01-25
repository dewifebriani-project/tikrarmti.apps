-- ============================================================================
-- Check halaqah table RLS and data access
-- ============================================================================

-- 1. Check if halaqah table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'halaqah'
) as halaqah_table_exists;

-- 2. Check if RLS is enabled on halaqah table (if it exists)
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'halaqah';

-- 3. List all policies on halaqah table
SELECT
  policyname,
  roles,
  cmd,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'halaqah';

-- 4. Test access to halaqah table as authenticated user
SELECT COUNT(*) as total_halaqah FROM halaqah;

-- 5. Test access to active halaqah
SELECT COUNT(*) as active_halaqah FROM halaqah WHERE status = 'active';

-- 6. Show sample halaqah structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'halaqah'
ORDER BY ordinal_position;
