-- =====================================================
-- ADD ADMIN/MUSYRIFAH UPDATE AND DELETE POLICIES FOR JURNAL
-- =====================================================
-- Purpose: Allow admin and musyrifah to UPDATE and DELETE
--          any jurnal records for management purposes
-- Created: 2026-01-24
-- =====================================================

-- =====================================================
-- 1. ADD UPDATE POLICY FOR ADMIN/MUSYRIFAH
-- =====================================================

CREATE POLICY "Admins and Musyrifah can update all jurnal records"
  ON public.jurnal_records
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

CREATE POLICY "Admins and Musyrifah can delete all jurnal records"
  ON public.jurnal_records
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

COMMENT ON POLICY "Admins and Musyrifah can update all jurnal records" ON public.jurnal_records IS
  'RLS UPDATE policy: Admin and Musyrifah users can update any jurnal record';

COMMENT ON POLICY "Admins and Musyrifah can delete all jurnal records" ON public.jurnal_records IS
  'RLS DELETE policy: Admin and Musyrifah users can delete any jurnal record';

-- =====================================================
-- 4. VERIFY POLICIES ARE ACTIVE
-- =====================================================

SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'jurnal_records'
ORDER BY policyname;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
