-- ============================================================================
-- Fix: Allow viewing user profiles for halaqah_students query
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Problem: When querying halaqah_students with a relation to users table,
-- the RLS policy on users blocks the join because non-admin users can only
-- view their own profile.

-- Solution: Add policies to allow muallimah to view thalibah in their halaqah
-- and thalibah to view their muallimah.

-- ============================================================================
-- 1. Muallimah can view thalibah in their halaqah
-- ============================================================================

DROP POLICY IF EXISTS "Muallimah can view thalibah in their halaqah" ON users;

CREATE POLICY "Muallimah can view thalibah in their halaqah"
ON users
FOR SELECT
TO authenticated
USING (
  -- User can view their own profile
  id = auth.uid()
  OR
  -- Muallimah can view thalibah enrolled in their halaqah
  EXISTS (
    SELECT 1
    FROM halaqah_students hs
    INNER JOIN halaqah h ON h.id = hs.halaqah_id
    WHERE hs.thalibah_id = users.id
      AND h.muallimah_id = auth.uid()
  )
);

-- ============================================================================
-- 2. Thalibah can view their muallimah
-- ============================================================================

DROP POLICY IF EXISTS "Thalibah can view their muallimah" ON users;

CREATE POLICY "Thalibah can view their muallimah"
ON users
FOR SELECT
TO authenticated
USING (
  -- User can view their own profile
  id = auth.uid()
  OR
  -- Thalibah can view muallimah of their halaqah
  EXISTS (
    SELECT 1
    FROM halaqah_students hs
    INNER JOIN halaqah h ON h.id = hs.halaqah_id
    WHERE h.muallimah_id = users.id
      AND hs.thalibah_id = auth.uid()
  )
);

-- ============================================================================
-- Verification: Check the policies were created
-- ============================================================================

SELECT
  policyname,
  cmd,
  permissive::text as permissive,
  substr(qual::text, 1, 100) as using_preview
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
  AND policyname IN (
    'Muallimah can view thalibah in their halaqah',
    'Thalibah can view their muallimah'
  )
ORDER BY policyname;
