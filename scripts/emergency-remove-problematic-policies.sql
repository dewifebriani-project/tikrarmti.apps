-- ============================================================================
-- EMERGENCY FIX: Remove all problematic RLS policies and restore working state
-- Run this in Supabase SQL Editor immediately
-- ============================================================================

-- Remove ALL the policies I added that are causing login issues
DROP POLICY IF EXISTS "Muallimah can view thalibah in their halaqah" ON users;
DROP POLICY IF EXISTS "Thalibah can view their muallimah" ON users;
DROP POLICY IF EXISTS "Authenticated users can view public profiles via FK" ON users;

-- ============================================================================
-- Restore the original working policies
-- ============================================================================

-- These are the original policies that were working before my changes
-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
ON users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ============================================================================
-- Alternative solution for halaqah_students query
-- Instead of modifying users RLS, modify the query to NOT use the relation
-- and fetch user data separately
-- ============================================================================

-- Verification: Check current policies on users table
SELECT
  policyname,
  cmd,
  permissive::text as permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
ORDER BY policyname;
