-- ============================================================================
-- Check RLS policies on halaqah_students table
-- ============================================================================

-- Show all RLS policies on halaqah_students
SELECT
  '=== HALAQAH_STUDENTS RLS POLICIES ===' as section,
  policyname,
  cmd,
  permissive::text as permissive,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'halaqah_students'
ORDER BY cmd, policyname;

-- Check if RLS is enabled
SELECT
  '=== RLS STATUS ===' as section,
  relname::text as table_name,
  relrowsecurity as rls_enabled
FROM pg_class
WHERE relname = 'halaqah_students';

-- Check foreign key constraint name
SELECT
  '=== FOREIGN KEYS ===' as section,
  conname::text as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'halaqah_students'::regclass
  AND contype = 'f'
  AND conname::text LIKE '%thalibah_id%';
