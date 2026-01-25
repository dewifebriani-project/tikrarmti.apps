-- =====================================================
-- FIX JURNAL_RECORDS AND TASHIH_RECORDS RLS FOR MUSYRIFAH
-- =====================================================
-- Purpose: Allow musyrifah users to view ALL jurnal and tashih records
--          (currently only admin can view all)
-- Created: 2026-01-24
-- =====================================================

-- =====================================================
-- 1. FIX JURNAL_RECORDS RLS POLICY
-- =====================================================

-- Drop existing admin-only policy
DROP POLICY IF EXISTS "Admins can view all jurnal records" ON public.jurnal_records;

-- Create new policy that allows both admin AND musyrifah to view all records
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
-- 2. FIX TASHIH_RECORDS RLS POLICY
-- =====================================================

-- Drop existing admin-only policy
DROP POLICY IF EXISTS "Admins can view all tashih records" ON public.tashih_records;

-- Create new policy that allows both admin AND musyrifah to view all records
CREATE POLICY "Admins and Musyrifah can view all tashih records"
  ON public.tashih_records FOR SELECT
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
-- 3. VERIFY POLICIES
-- =====================================================

-- Verify jurnal_records policy
SELECT
  'jurnal_records' as table_name,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'jurnal_records'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- Verify tashih_records policy
SELECT
  'tashih_records' as table_name,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'tashih_records'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
