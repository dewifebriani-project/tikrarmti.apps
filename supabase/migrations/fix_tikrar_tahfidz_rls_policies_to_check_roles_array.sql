-- ============================================================================
-- FIX PENDAFTARAN TIKRAR TAHFIDZ RLS POLICIES TO CHECK ROLES ARRAY
-- ============================================================================
-- This migration fixes the RLS policies on the pendaftaran_tikrar_tahfidz
-- table to check the roles array instead of the deprecated role column.

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can manage programs" ON programs;
DROP POLICY IF EXISTS "Admins can view all tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Admins can update all tikrar registrations" ON pendaftaran_tikrar_tahfidz;

-- ============================================================================
-- PROGRAMS TABLE POLICIES (Fixed)
-- ============================================================================

-- Policy: Admins can manage all programs
CREATE POLICY "Admins can manage programs"
ON programs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND 'admin' = ANY(users.roles)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND 'admin' = ANY(users.roles)
  )
);

-- ============================================================================
-- PENDAFTARAN TIKRAR TAHFIDZ POLICIES (Fixed)
-- ============================================================================

-- Policy: Admins can view all registrations
CREATE POLICY "Admins can view all tikrar registrations"
ON pendaftaran_tikrar_tahfidz
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND 'admin' = ANY(users.roles)
  )
);

-- Policy: Admins can update all registrations
CREATE POLICY "Admins can update all tikrar registrations"
ON pendaftaran_tikrar_tahfidz
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND 'admin' = ANY(users.roles)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND 'admin' = ANY(users.roles)
  )
);
