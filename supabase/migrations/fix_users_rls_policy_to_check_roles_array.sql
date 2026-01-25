-- ============================================================================
-- FIX USERS TABLE RLS POLICY TO CHECK ROLES ARRAY
-- ============================================================================
-- This migration fixes the RLS policy on the users table to check the
-- roles array instead of the deprecated role column.

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- ============================================================================
-- ADMIN POLICIES - Full Access (Fixed to check roles array)
-- ============================================================================

-- Policy: Admins can view all users
CREATE POLICY "Admins can view all users"
ON users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND 'admin' = ANY(u.roles)
  )
);

-- Policy: Admins can manage all users (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage all users"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND 'admin' = ANY(u.roles)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND 'admin' = ANY(u.roles)
  )
);
