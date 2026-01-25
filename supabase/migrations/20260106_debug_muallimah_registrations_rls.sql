-- ============================================================================
-- DEBUG: Test muallimah_registrations RLS Policy
-- ============================================================================
-- Purpose: Debug why INSERT is failing
-- Created: 2026-01-06
-- ============================================================================

-- Add a temporary policy that allows all INSERTs for debugging
CREATE POLICY "DEBUG: Allow all INSERTs"
ON muallimah_registrations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Show all policies
SELECT
  policyname,
  permissive,
  cmd,
  substr(qual, 1, 100) as using_clause,
  substr(with_check, 1, 100) as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'muallimah_registrations'
ORDER BY policyname;

-- ============================================================================
-- INSTRUCTIONS:
-- 1. Run this query in Supabase SQL Editor
-- 2. Try to submit the muallimah registration form again
-- 3. If it succeeds, the issue is with the original policy
-- 4. If it still fails, the issue is elsewhere (not RLS)
-- ============================================================================
