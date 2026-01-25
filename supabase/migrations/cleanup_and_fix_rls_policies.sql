-- ============================================================================
-- CLEANUP AND FIX RLS POLICIES
-- ============================================================================
-- This script removes all existing conflicting policies and creates clean ones

-- ============================================================================
-- PROGRAMS TABLE - CLEANUP
-- ============================================================================

-- Drop ALL existing policies on programs table
DROP POLICY IF EXISTS "Authenticated users can view all programs" ON programs;
DROP POLICY IF EXISTS "Authenticated users can view open programs" ON programs;
DROP POLICY IF EXISTS "Admins can manage programs" ON programs;
DROP POLICY IF EXISTS "Admins can insert programs" ON programs;
DROP POLICY IF EXISTS "Admins can update programs" ON programs;
DROP POLICY IF EXISTS "Admins can view all programs" ON programs;
DROP POLICY IF EXISTS "programs_insert_admin" ON programs;
DROP POLICY IF EXISTS "programs_select_all" ON programs;
DROP POLICY IF EXISTS "programs_update_admin" ON programs;

-- Create single, simple policy for SELECT - allow all authenticated users
CREATE POLICY "allow_authenticated_select_programs"
ON programs
FOR SELECT
TO authenticated
USING (true);

-- Create admin policies for INSERT/UPDATE/DELETE
CREATE POLICY "allow_admin_all_programs"
ON programs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin', 'musyrifah', 'muallimah')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin', 'musyrifah', 'muallimah')
  )
);

-- ============================================================================
-- PENDAFTARAN TIKRAR TAHFIDZ - CLEANUP
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Users can insert their own tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Users can update their own tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Admins can view all tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Admins can update all tikrar registrations" ON pendaftaran_tikrar_tahfidz;

-- Recreate clean policies
CREATE POLICY "allow_user_select_own_tikrar"
ON pendaftaran_tikrar_tahfidz
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "allow_user_insert_own_tikrar"
ON pendaftaran_tikrar_tahfidz
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_user_update_own_tikrar"
ON pendaftaran_tikrar_tahfidz
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_admin_select_all_tikrar"
ON pendaftaran_tikrar_tahfidz
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin', 'musyrifah', 'muallimah')
  )
);

CREATE POLICY "allow_admin_all_tikrar"
ON pendaftaran_tikrar_tahfidz
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin', 'musyrifah', 'muallimah')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin', 'musyrifah', 'muallimah')
  )
);
