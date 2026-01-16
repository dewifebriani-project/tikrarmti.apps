-- ============================================================================
-- FORCE DROP ALL POLICIES AND RECREATE
-- ============================================================================
-- This script drops ALL policies on the three tables and recreates them
-- Run this if there are conflicts with existing policies
-- ============================================================================

-- First, disable RLS temporarily to allow access
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pendaftaran_tikrar_tahfidz DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daftar_ulang_submissions DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- NOW RECREATE ALL POLICIES FROM SCRATCH
-- ============================================================================

-- ============================================================================
-- 1. USERS TABLE POLICIES
-- ============================================================================

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can view own profile (CRITICAL FOR LOGIN)
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
TO authenticated
USING ('admin' = ANY((SELECT roles FROM public.users WHERE id = auth.uid())));

-- Admins can manage all users
CREATE POLICY "Admins can manage all users"
ON public.users
FOR ALL
TO authenticated
USING ('admin' = ANY((SELECT roles FROM public.users WHERE id = auth.uid())))
WITH CHECK ('admin' = ANY((SELECT roles FROM public.users WHERE id = auth.uid())));

-- Service role bypass
CREATE POLICY "Service role bypass on users"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 2. PENDAFTARAN TIKRAR TAHFIDZ TABLE POLICIES
-- ============================================================================

-- Re-enable RLS
ALTER TABLE public.pendaftaran_tikrar_tahfidz ENABLE ROW LEVEL SECURITY;

-- Users can view own registrations
CREATE POLICY "Users can view own tikrar registrations"
ON public.pendaftaran_tikrar_tahfidz
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert own registrations
CREATE POLICY "Users can insert own tikrar registrations"
ON public.pendaftaran_tikrar_tahfidz
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update own registrations
CREATE POLICY "Users can update own tikrar registrations"
ON public.pendaftaran_tikrar_tahfidz
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all tikrar registrations"
ON public.pendaftaran_tikrar_tahfidz
FOR SELECT
TO authenticated
USING ('admin' = ANY((SELECT roles FROM public.users WHERE id = auth.uid())));

-- Admins can update all
CREATE POLICY "Admins can update all tikrar registrations"
ON public.pendaftaran_tikrar_tahfidz
FOR UPDATE
TO authenticated
USING ('admin' = ANY((SELECT roles FROM public.users WHERE id = auth.uid())))
WITH CHECK ('admin' = ANY((SELECT roles FROM public.users WHERE id = auth.uid())));

-- Service role bypass
CREATE POLICY "Service role bypass on pendaftaran"
ON public.pendaftaran_tikrar_tahfidz
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 3. DAFTAR_ULANG_SUBMISSIONS TABLE POLICIES
-- ============================================================================

-- Re-enable RLS
ALTER TABLE public.daftar_ulang_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view own submissions
CREATE POLICY "Users can view own daftar ulang"
ON public.daftar_ulang_submissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert own submissions
CREATE POLICY "Users can insert own daftar ulang"
ON public.daftar_ulang_submissions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update own draft submissions
CREATE POLICY "Users can update own draft daftar ulang"
ON public.daftar_ulang_submissions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status = 'draft')
WITH CHECK (user_id = auth.uid());

-- Admins can view all
CREATE POLICY "Admins can view all daftar ulang"
ON public.daftar_ulang_submissions
FOR SELECT
TO authenticated
USING ('admin' = ANY((SELECT roles FROM public.users WHERE id = auth.uid())));

-- Admins can update all
CREATE POLICY "Admins can update all daftar ulang"
ON public.daftar_ulang_submissions
FOR UPDATE
TO authenticated
USING ('admin' = ANY((SELECT roles FROM public.users WHERE id = auth.uid())))
WITH CHECK ('admin' = ANY((SELECT roles FROM public.users WHERE id = auth.uid())));

-- Service role bypass
CREATE POLICY "Service role bypass on submissions"
ON public.daftar_ulang_submissions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- VERIFICATION - SHOW ALL POLICIES
-- ============================================================================

SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE
    WHEN qual LIKE '%auth.uid() = id%' THEN 'User can view own'
    WHEN qual LIKE '%admin%ANY%roles%' THEN 'Admin can view all'
    WHEN qual = '(true)' THEN 'Service role bypass'
    ELSE 'Other'
  END as policy_type
FROM pg_policies
WHERE tablename IN ('users', 'pendaftaran_tikrar_tahfidz', 'daftar_ulang_submissions')
ORDER BY tablename, policyname;
