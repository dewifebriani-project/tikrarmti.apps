-- =====================================================
-- FIX DAFTAR ULANG SUBMISSIONS RLS - REMOVE INFINITE RECURSION
-- =====================================================

-- Drop only the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view batch daftar ulang submissions" ON public.daftar_ulang_submissions;

-- Note: "Users can view own daftar ulang submissions" already exists
-- and is sufficient for the daftar ulang page
