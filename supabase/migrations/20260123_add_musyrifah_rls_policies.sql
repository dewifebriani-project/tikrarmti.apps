-- =====================================================
-- ADD MUSYRIFAH RLS POLICIES FOR TASHIH AND JURNAL RECORDS
-- =====================================================
-- Purpose: Allow musyrifah to view all tashih and jurnal records
--          to monitor thalibah progress
-- Created: 2026-01-23
-- =====================================================

-- =====================================================
-- 1. ADD MUSYRIFAH POLICY TO TASHIH_RECORDS
-- =====================================================

-- Drop existing admin/musyrifah policy first to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all tashih records" ON public.tashih_records;

-- Create unified policy for both admin and musyrifah
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
-- 2. ADD MUSYRIFAH POLICY TO JURNAL_RECORDS
-- =====================================================

-- Drop existing admin/musyrifah policy first to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all jurnal records" ON public.jurnal_records;

-- Create unified policy for both admin and musyrifah
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
-- 3. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON POLICY "Admins and Musyrifah can view all tashih records" ON public.tashih_records IS
  'RLS SELECT policy: Admin and Musyrifah users can view all tashih records for monitoring purposes';

COMMENT ON POLICY "Admins and Musyrifah can view all jurnal records" ON public.jurnal_records IS
  'RLS SELECT policy: Admin and Musyrifah users can view all jurnal records for monitoring purposes';

-- =====================================================
-- 4. VERIFY POLICIES ARE ACTIVE
-- =====================================================

DO $$
DECLARE
  tashih_policy_count INTEGER;
  jurnal_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tashih_policy_count
  FROM pg_policies
  WHERE tablename = 'tashih_records';

  SELECT COUNT(*) INTO jurnal_policy_count
  FROM pg_policies
  WHERE tablename = 'jurnal_records';

  RAISE NOTICE 'Total policies on tashih_records: %', tashih_policy_count;
  RAISE NOTICE 'Total policies on jurnal_records: %', jurnal_policy_count;
END $$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================

-- Verification queries (run these after migration to verify):

-- Check if musyrifah can view all records
/*
-- Login as a musyrifah user and run:
SELECT COUNT(*) FROM public.tashih_records;
SELECT COUNT(*) FROM public.jurnal_records;

-- Expected: Should return total count of all records
*/

-- Check RLS policies
/*
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('tashih_records', 'jurnal_records')
  AND policyname LIKE '%Admin% and Musyrifah%'
ORDER BY tablename, policyname;
*/
