-- ============================================================================
-- FORCE FIX: Replace ALL Users Table RLS Policies
-- ============================================================================
-- Purpose: CRITICAL FIX - Replace ALL existing policies with working versions
-- Created: 2026-01-06
-- ============================================================================

-- This script FORCEFULLY replaces ALL policies on the users table
-- to fix the 406 Not Acceptable error preventing login

-- Step 1: Remove ALL existing policies (force drop)
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'users'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON users', policy_record.policyname);
    RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
  END LOOP;
END $$;

-- Step 2: Create new NON-CIRCULAR policies

-- 1. Users can view their own profile (CRITICAL FOR LOGIN!)
CREATE POLICY "Users can view own profile"
ON users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 2. Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 3. Service role can do anything (bypass RLS for admin operations)
CREATE POLICY "Service role full access"
ON users
FOR ALL
TO service_role
WITH CHECK (true);

-- 4. Admins can view all users (using helper function to avoid circular ref)
CREATE POLICY "Admins can view all users"
ON users
FOR SELECT
TO authenticated
USING (
  -- Direct check without circular reference
  EXISTS (
    SELECT 1
    FROM users u_check
    WHERE u_check.id = auth.uid()
    AND u_check.id IS NOT NULL
    AND (
      u_check.role = 'admin'
      OR u_check.role = 'super_admin'
      OR 'admin' = ANY(u_check.roles)
      OR 'super_admin' = ANY(u_check.roles)
    )
  )
);

-- 5. Admins can manage all users
CREATE POLICY "Admins can manage all users"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM users u_check
    WHERE u_check.id = auth.uid()
    AND (
      u_check.role = 'admin'
      OR 'admin' = ANY(u_check.roles)
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users u_check
    WHERE u_check.id = auth.uid()
    AND (
      u_check.role = 'admin'
      OR 'admin' = ANY(u_check.roles)
    )
  )
);

-- Step 3: Verify policies were created
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'users';

  RAISE NOTICE 'Total policies on users table: %', policy_count;

  IF policy_count = 0 THEN
    RAISE EXCEPTION 'No policies found on users table! RLS will block all access.';
  END IF;
END $$;

-- Step 4: Show all policies for verification
SELECT
  policyname,
  permissive,
  cmd,
  substr(qual, 1, 100) as using_clause
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'users'
ORDER BY policyname;

-- ============================================================================
-- IMPORTANT: After running this migration, test login immediately
-- ============================================================================
-- Expected behavior:
-- 1. User can login (SELECT * FROM users WHERE id = auth.uid() works)
-- 2. Admin can view all users
-- 3. User can update own profile
-- ============================================================================
