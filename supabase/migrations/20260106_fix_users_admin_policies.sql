-- ============================================================================
-- FIX USERS RLS POLICIES - Remove Circular Reference COMPLETELY
-- ============================================================================
-- Purpose: Fix circular reference in admin policies
-- Created: 2026-01-06
-- ============================================================================

-- PROBLEM: Previous policies still had circular reference:
-- EXISTS (SELECT 1 FROM users u_check WHERE u_check.id = auth.uid() ...)
-- This queries users table FROM within users table policy!

-- SOLUTION: Use is_admin_user() helper function or direct role check

-- Step 1: Drop problematic policies
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Step 2: Create admin policies using helper function (NO circular reference)
CREATE POLICY "Admins can view all users"
ON users
FOR SELECT
TO authenticated
USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can manage all users"
ON users
FOR ALL
TO authenticated
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

-- Step 3: Verify - show all policies
SELECT
  policyname,
  cmd,
  CASE
    WHEN qual IS NOT NULL THEN substr(qual, 1, 80)
    WHEN with_check IS NOT NULL THEN substr(with_check, 1, 80)
    ELSE 'No restriction'
  END as policy_definition
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'users'
ORDER BY policyname;
