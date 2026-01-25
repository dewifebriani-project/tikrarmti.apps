-- =====================================================
-- COMPREHENSIVE FIX FOR JURNAL_RECORDS RLS POLICIES
-- =====================================================
-- Purpose: Fix RLS policies to allow musyrifah to view all
--          jurnal records, same as tashih_records
-- Created: 2026-01-24
-- =====================================================

-- First, let's see what policies exist
-- (Run this separately first to check)
SELECT
  'jurnal_records' as table_name,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'jurnal_records'
ORDER BY policyname;

-- =====================================================
-- 1. DROP ALL EXISTING SELECT POLICIES FOR JURNAL_RECORDS
-- =====================================================

-- Drop ALL SELECT policies on jurnal_records
DROP POLICY IF EXISTS "Users can view own jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Admins can view all jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Admins and Musyrifah can view all jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "jurnal_select_own" ON public.jurnal_records;  -- Old policy name
DROP POLICY IF EXISTS "jurnal_select_admin" ON public.jurnal_records;  -- Old policy name
DROP POLICY IF EXISTS "jurnal_select_musyrifah" ON public.jurnal_records;  -- Old policy name

-- =====================================================
-- 2. CREATE NEW POLICIES - ORDER MATTERS!
-- =====================================================

-- Policy 1: Users can view their own records (least permissive - check first)
CREATE POLICY "Users can view own jurnal records"
  ON public.jurnal_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Admins and Musyrifah can view ALL records (most permissive - check second)
CREATE POLICY "Admins and Musyrifah can view all jurnal records"
  ON public.jurnal_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (
        users.role = 'admin'
        OR users.role = 'musyrifah'
        OR 'admin' = ANY(users.roles)
        OR 'musyrifah' = ANY(users.roles)
      )
    )
  );

-- =====================================================
-- 3. VERIFY NEW POLICIES
-- =====================================================

SELECT
  'jurnal_records' as table_name,
  policyname,
  cmd,
  permissive,
  roles,
  CASE WHEN qual IS NOT NULL THEN substring(qual, 1, 100) || '...' ELSE NULL END as policy_preview
FROM pg_policies
WHERE tablename = 'jurnal_records'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- =====================================================
-- 4. TEST WITH CURRENT USER
-- =====================================================

-- This should show how many records the current user can see
-- Replace 'YOUR_USER_ID' with actual user ID to test
-- SELECT COUNT(*) FROM jurnal_records;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
