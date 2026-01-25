-- ============================================================================
-- Fix: Remove problematic RLS policies that break login
-- Run this in Supabase SQL Editor immediately
-- ============================================================================

-- Remove the problematic policies
DROP POLICY IF EXISTS "Muallimah can view thalibah in their halaqah" ON users;
DROP POLICY IF EXISTS "Thalibah can view their muallimah" ON users;

-- ============================================================================
-- Alternative approach: Use a simpler policy that doesn't break login
-- ============================================================================

-- This policy is simpler and won't interfere with login
-- It allows viewing user profiles when there's a direct halaqah relationship

CREATE POLICY "Muallimah can view thalibah in their halaqah"
ON users
FOR SELECT
TO authenticated
USING (
  -- Always allow viewing own profile (this prevents login issues)
  id = auth.uid()
  OR
  -- Simple check: if user is a thalibah in any halaqah where current user is muallimah
  EXISTS (
    SELECT 1
    FROM halaqah
    WHERE muallimah_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM halaqah_students
        WHERE halaqah_id = halaqah.id
          AND thalibah_id = users.id
      )
  )
);

-- Verification query - should show the new policy
SELECT
  policyname,
  cmd,
  permissive::text as permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
  AND policyname = 'Muallimah can view thalibah in their halaqah';
