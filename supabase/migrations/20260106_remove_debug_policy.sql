-- ============================================================================
-- Remove Debug Policy
-- ============================================================================
-- Purpose: Clean up temporary debug policy
-- Created: 2026-01-06
-- ============================================================================

DROP POLICY IF EXISTS "DEBUG: Allow all INSERTs" ON muallimah_registrations;

-- Verify only correct policies remain
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
