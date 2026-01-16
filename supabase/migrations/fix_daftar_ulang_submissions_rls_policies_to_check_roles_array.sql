-- ============================================================================
-- FIX DAFTAR_ULANG_SUBMISSIONS RLS POLICIES TO CHECK ROLES ARRAY
-- ============================================================================
-- This migration fixes the RLS policies on the daftar_ulang_submissions
-- table to check the roles array instead of the deprecated role column.

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can view all daftar ulang" ON public.daftar_ulang_submissions;
DROP POLICY IF EXISTS "Admins can update all daftar ulang" ON public.daftar_ulang_submissions;

-- ============================================================================
-- ADMIN POLICIES (Fixed to check roles array)
-- ============================================================================

-- Policy: Admins can view all submissions
CREATE POLICY "Admins can view all daftar ulang"
  ON public.daftar_ulang_submissions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND 'admin' = ANY(users.roles)
  ));

-- Policy: Admins can update all submissions
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
