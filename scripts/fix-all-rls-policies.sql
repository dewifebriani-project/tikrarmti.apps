-- ============================================================================
-- COMPLETE FIX FOR ALL RLS POLICIES TO CHECK ROLES ARRAY
-- ============================================================================
-- This script fixes all RLS policies that were checking the deprecated
-- 'role' column instead of the 'roles' array column.
--
-- Run this entire script in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. FIX USERS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Policy: Admins can view all users (Fixed to check roles array)
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

-- Policy: Admins can manage all users (Fixed to check roles array)
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

-- ============================================================================
-- 2. FIX PENDAFTARAN TIKRAR TAHFIDZ TABLE RLS POLICIES
-- ============================================================================

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can view all tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Admins can update all tikrar registrations" ON pendaftaran_tikrar_tahfidz;

-- Policy: Admins can view all registrations (Fixed)
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

-- Policy: Admins can update all registrations (Fixed)
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

-- ============================================================================
-- 3. FIX DAFTAR_ULANG_SUBMISSIONS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can view all daftar ulang" ON public.daftar_ulang_submissions;
DROP POLICY IF EXISTS "Admins can update all daftar ulang" ON public.daftar_ulang_submissions;

-- Policy: Admins can view all submissions (Fixed)
CREATE POLICY "Admins can view all daftar ulang"
  ON public.daftar_ulang_submissions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND 'admin' = ANY(users.roles)
  ));

-- Policy: Admins can update all submissions (Fixed)
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

-- ============================================================================
-- VERIFICATION QUERIES (Run these after the script to verify)
-- ============================================================================

-- Check that policies were created successfully
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('users', 'pendaftaran_tikrar_tahfidz', 'daftar_ulang_submissions')
  AND policyname LIKE '%admin%'
ORDER BY tablename, policyname;
