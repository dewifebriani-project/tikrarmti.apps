-- ============================================================================
-- Diagnose halaqah_students query issue
-- ============================================================================

-- Check if the foreign key constraint exists with the expected name
SELECT
  '=== FOREIGN KEY CONSTRAINT ===' as section,
  conname::text as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'halaqah_students'::regclass
  AND contype = 'f'
ORDER BY conname;

-- Check table structure
SELECT
  '=== TABLE STRUCTURE ===' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'halaqah_students'
ORDER BY ordinal_position;

-- Show current RLS policies
SELECT
  '=== RLS POLICIES ===' as section,
  policyname,
  cmd,
  permissive::text as permissive,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'halaqah_students'
ORDER BY cmd, policyname;

-- Test: Can we query halaqah_students with a direct join?
-- Replace <USER_ID> with actual user ID for testing
-- SELECT hs.id, hs.halaqah_id, hs.thalibah_id, hs.status, u.full_name, u.email
-- FROM halaqah_students hs
-- LEFT JOIN users u ON u.id = hs.thalibah_id
-- WHERE hs.halaqah_id = '452410bc-3212-44f2-8444-5329c5334a72'
-- ORDER BY hs.created_at;
