-- =====================================================
-- QUICK FIX: DROP OLD jurnal_select_own POLICY
-- =====================================================
-- Run this in Supabase SQL Editor to fix the issue
-- =====================================================

-- First, see what policies exist
SELECT
  'jurnal_records' as table_name,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'jurnal_records'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- Drop the old policy that's causing issues
DROP POLICY IF EXISTS "jurnal_select_own" ON public.jurnal_records;

-- Verify it's gone
SELECT
  'jurnal_records' as table_name,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'jurnal_records'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- =====================================================
-- END OF QUICK FIX
-- =====================================================
