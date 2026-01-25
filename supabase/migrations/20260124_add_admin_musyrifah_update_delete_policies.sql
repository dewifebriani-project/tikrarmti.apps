-- =====================================================
-- ADD ADMIN/MUSYRIFAH UPDATE AND DELETE POLICIES
-- =====================================================
-- Purpose: Allow admin and musyrifah to UPDATE and DELETE
--          any tashih records for management purposes
-- Created: 2026-01-24
-- =====================================================

-- =====================================================
-- 1. ADD UPDATE POLICY FOR ADMIN/MUSYRIFAH
-- =====================================================

CREATE POLICY "Admins and Musyrifah can update all tashih records"
  ON public.tashih_records
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (
        u.role = 'admin'
        OR u.role = 'musyrifah'
        OR 'admin' = ANY(u.roles)
        OR 'musyrifah' = ANY(u.roles)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (
        u.role = 'admin'
        OR u.role = 'musyrifah'
        OR 'admin' = ANY(u.roles)
        OR 'musyrifah' = ANY(u.roles)
      )
    )
  );

-- =====================================================
-- 2. ADD DELETE POLICY FOR ADMIN/MUSYRIFAH
-- =====================================================

CREATE POLICY "Admins and Musyrifah can delete all tashih records"
  ON public.tashih_records
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (
        u.role = 'admin'
        OR u.role = 'musyrifah'
        OR 'admin' = ANY(u.roles)
        OR 'musyrifah' = ANY(u.roles)
      )
    )
  );

-- =====================================================
-- 3. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON POLICY "Admins and Musyrifah can update all tashih records" ON public.tashih_records IS
  'RLS UPDATE policy: Admin and Musyrifah users can update any tashih record (e.g., remove a specific block from multi-block records)';

COMMENT ON POLICY "Admins and Musyrifah can delete all tashih records" ON public.tashih_records IS
  'RLS DELETE policy: Admin and Musyrifah users can delete any tashih record';

-- =====================================================
-- 4. VERIFY POLICIES ARE ACTIVE
-- =====================================================

SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'tashih_records'
ORDER BY policyname;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
