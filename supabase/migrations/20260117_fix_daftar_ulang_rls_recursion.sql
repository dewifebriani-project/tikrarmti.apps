-- =====================================================
-- FIX DAFTAR ULANG SUBMISSIONS RLS - REMOVE INFINITE RECURSION
-- =====================================================
-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view batch daftar ulang submissions" ON public.daftar_ulang_submissions;

-- Keep only the simple policy for viewing own submissions
-- Users can only view their own daftar ulang submissions
-- This is sufficient for the daftar ulang page
-- The pairing/halaqah features will use different endpoints or admin access

CREATE POLICY "Users can view own daftar ulang submissions"
  ON public.daftar_ulang_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
