-- ============================================================================
-- USERS TABLE RLS POLICIES
-- ============================================================================
-- This migration adds Row Level Security policies for the users table
-- to allow users to read their own profile and admins to manage all users

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- ============================================================================
-- USER POLICIES - Self Access
-- ============================================================================

-- Policy: Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================================================
-- ADMIN POLICIES - Full Access
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
    AND u.role IN ('admin', 'super_admin', 'musyrifah', 'muallimah')
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
    AND u.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND u.role IN ('admin', 'super_admin')
  )
);
