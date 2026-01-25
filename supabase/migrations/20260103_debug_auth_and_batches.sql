-- ============================================================================
-- Debug Script: Check Auth and Batches Access
-- Date: 2026-01-03
-- ============================================================================

-- 1. Check if batches table has data
SELECT 'Batches count:' as info, COUNT(*) as count FROM batches;

-- 2. Check batches with status 'open'
SELECT 'Open batches:' as info, id, name, status FROM batches WHERE status = 'open';

-- 3. Check current RLS status
SELECT 'RLS enabled:' as info, relrowsecurity FROM pg_class WHERE relname = 'batches';

-- 4. Test RLS policies - this simulates what authenticated user sees
-- We need to temporarily disable RLS to check the actual data
SET LOCAL session_replication_role = 'replica';
SELECT id, name, status FROM batches WHERE status = 'open' ORDER BY created_at DESC;

-- 5. Show all policies on batches table (already done in previous migration)

-- 6. Check if there are any duplicate policies that might conflict
SELECT policyname, COUNT(*) as count
FROM pg_policies
WHERE tablename = 'batches'
GROUP BY policyname
HAVING COUNT(*) > 1;
