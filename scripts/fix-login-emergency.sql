-- ============================================================================
-- EMERGENCY FIX - Restore Login Access for All Users
-- ============================================================================
-- This script fixes RLS policies that are blocking login
-- Run this IMMEDIATELY if no users can login
-- ============================================================================

-- ============================================================================
-- 1. FIX USERS TABLE - Ensure users can at least read their own profile
-- ============================================================================

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Service role can bypass all RLS" ON users;

-- Create SIMPLE policies that work
-- Policy 1: All authenticated users can view their own profile
CREATE POLICY "Users can view own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: All authenticated users can update their own profile
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 3: Admins can view all users (using roles array)
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

-- Policy 4: Service role bypass (for system operations)
CREATE POLICY "Service role can bypass all RLS"
ON users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 2. FIX PENDAFTARAN TIKRAR TAHFIDZ TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Users can insert their own tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Users can update their own tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Admins can view all tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Admins can update all tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Service role bypass on pendaftaran" ON pendaftaran_tikrar_tahfidz;

-- Users can view their own registrations
CREATE POLICY "Users can view own tikrar registrations"
ON pendaftaran_tikrar_tahfidz
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own registrations
CREATE POLICY "Users can insert own tikrar registrations"
ON pendaftaran_tikrar_tahfidz
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own registrations
CREATE POLICY "Users can update own tikrar registrations"
ON pendaftaran_tikrar_tahfidz
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id);

-- Admins can view all
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

-- Admins can update all
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

-- Service role bypass
CREATE POLICY "Service role bypass on pendaftaran"
ON pendaftaran_tikrar_tahfidz
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 3. FIX DAFTAR_ULANG_SUBMISSIONS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own daftar ulang" ON public.daftar_ulang_submissions;
DROP POLICY IF EXISTS "Users can insert own daftar ulang" ON public.daftar_ulang_submissions;
DROP POLICY IF EXISTS "Users can update own draft daftar ulang" ON public.daftar_ulang_submissions;
DROP POLICY IF EXISTS "Admins can view all daftar ulang" ON public.daftar_ulang_submissions;
DROP POLICY IF EXISTS "Admins can update all daftar ulang" ON public.daftar_ulang_submissions;
DROP POLICY IF EXISTS "Service role bypass on submissions" ON public.daftar_ulang_submissions;

-- Users can view their own submissions
CREATE POLICY "Users can view own daftar ulang"
  ON public.daftar_ulang_submissions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own submissions
CREATE POLICY "Users can insert own daftar ulang"
  ON public.daftar_ulang_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own draft submissions
CREATE POLICY "Users can update own draft daftar ulang"
  ON public.daftar_ulang_submissions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'draft')
  WITH CHECK (user_id = auth.uid());

-- Admins can view all submissions (FIXED to use roles array)
CREATE POLICY "Admins can view all daftar ulang"
  ON public.daftar_ulang_submissions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND 'admin' = ANY(users.roles)
  ));

-- Admins can update all submissions (FIXED to use roles array)
CREATE POLICY "Admins can update all daftar ulang"
  ON public.daftar_ulang_submissions
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND 'admin' = ANY(users.roles)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND 'admin' = ANY(users.roles)
  ));

-- Service role bypass
CREATE POLICY "Service role bypass on submissions"
  ON public.daftar_ulang_submissions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show all policies
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('users', 'pendaftaran_tikrar_tahfidz', 'daftar_ulang_submissions')
ORDER BY tablename, policyname;
