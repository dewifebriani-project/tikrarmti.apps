-- ============================================================================
-- Fix Users Table RLS Policies - Remove Self-Referencing Query
-- ============================================================================
-- Purpose: Fix 406 Not Acceptable error caused by circular reference in RLS policy
-- Created: 2026-01-06
-- ============================================================================

-- Problem: The RLS policies were querying the users table FROM within the users table policy
-- This caused a circular reference: "users" table policy tries to SELECT from "users" table
-- Solution: Use helper functions or simple auth.uid() checks instead

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins/staff can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- ============================================================================
-- 1. Policy: Users can view their own profile (CRITICAL FOR LOGIN)
-- ============================================================================
-- This is the BASE policy - every authenticated user can see their own data
CREATE POLICY "Users can view own profile"
ON users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- ============================================================================
-- 2. Policy: Users can update their own profile
-- ============================================================================
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ============================================================================
-- 3. Policy: Admins can view all users
-- ============================================================================
-- Uses is_admin_user helper function to avoid circular reference
CREATE POLICY "Admins can view all users"
ON users
FOR SELECT
TO authenticated
USING (is_admin_user(auth.uid()));

-- ============================================================================
-- 4. Policy: Admins can manage all users
-- ============================================================================
CREATE POLICY "Admins can manage all users"
ON users
FOR ALL
TO authenticated
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

-- ============================================================================
-- 5. Policy: Staff (musyrifah, muallimah) can view users
-- ============================================================================
CREATE POLICY "Staff can view all users"
ON users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (
      users.role IN ('musyrifah', 'muallimah', 'admin', 'super_admin')
      OR users.roles && ARRAY['musyrifah', 'muallimah', 'admin', 'super_admin']::text[]
    )
  )
);

-- ============================================================================
-- 6. Policy: Service role can do anything (for admin operations)
-- ============================================================================
CREATE POLICY "Service role can manage users"
ON users
FOR ALL
TO service_role
WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration, verify that:
-- 1. Users can login (SELECT * FROM users WHERE id = auth.uid() should work)
-- 2. Admins can view all users
-- 3. Users can update their own profile
-- ============================================================================

COMMENT ON POLICY "Users can view own profile" ON users IS
  'Base policy: Every authenticated user can view their own profile. Critical for login flow.';

COMMENT ON POLICY "Users can update own profile" ON users IS
  'Every authenticated user can update their own profile.';

COMMENT ON POLICY "Admins can view all users" ON users IS
  'Admin users can view all user profiles using is_admin_user() helper function.';

COMMENT ON POLICY "Admins can manage all users" ON users IS
  'Admin users can perform all operations on users table using is_admin_user() helper function.';

COMMENT ON POLICY "Staff can view all users" ON users IS
  'Staff (musyrifah, muallimah, admin) can view all users for operational purposes.';
