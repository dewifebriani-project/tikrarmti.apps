-- =====================================================
-- FULL ADMINISTRATIVE CONTROL FOR TASHIH/JURNAL RECORDS
-- =====================================================
-- Purpose: Allow admin and musyrifah to INSERT, UPDATE, and DELETE
--          tashih_records and jurnal_records for any user.
-- Created: 2026-04-11
-- =====================================================

-- 1. TASHIH_RECORDS POLICIES
DROP POLICY IF EXISTS "Admins and Musyrifah can insert all tashih records" ON public.tashih_records;
DROP POLICY IF EXISTS "Admins and Musyrifah can update all tashih records" ON public.tashih_records;
DROP POLICY IF EXISTS "Admins and Musyrifah can delete all tashih records" ON public.tashih_records;

-- INSERT
CREATE POLICY "Admins and Musyrifah can insert all tashih records"
  ON public.tashih_records FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (u.role = 'admin' OR u.role = 'musyrifah' OR 'admin' = ANY(u.roles) OR 'musyrifah' = ANY(u.roles))
    )
  );

-- UPDATE
CREATE POLICY "Admins and Musyrifah can update all tashih records"
  ON public.tashih_records FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (u.role = 'admin' OR u.role = 'musyrifah' OR 'admin' = ANY(u.roles) OR 'musyrifah' = ANY(u.roles))
    )
  );

-- DELETE
CREATE POLICY "Admins and Musyrifah can delete all tashih records"
  ON public.tashih_records FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (u.role = 'admin' OR u.role = 'musyrifah' OR 'admin' = ANY(u.roles) OR 'musyrifah' = ANY(u.roles))
    )
  );

-- 2. JURNAL_RECORDS POLICIES
DROP POLICY IF EXISTS "Admins and Musyrifah can insert all jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Admins and Musyrifah can update all jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Admins and Musyrifah can delete all jurnal records" ON public.jurnal_records;

-- INSERT
CREATE POLICY "Admins and Musyrifah can insert all jurnal records"
  ON public.jurnal_records FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (u.role = 'admin' OR u.role = 'musyrifah' OR 'admin' = ANY(u.roles) OR 'musyrifah' = ANY(u.roles))
    )
  );

-- UPDATE
CREATE POLICY "Admins and Musyrifah can update all jurnal records"
  ON public.jurnal_records FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (u.role = 'admin' OR u.role = 'musyrifah' OR 'admin' = ANY(u.roles) OR 'musyrifah' = ANY(u.roles))
    )
  );

-- DELETE
CREATE POLICY "Admins and Musyrifah can delete all jurnal records"
  ON public.jurnal_records FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (u.role = 'admin' OR u.role = 'musyrifah' OR 'admin' = ANY(u.roles) OR 'musyrifah' = ANY(u.roles))
    )
  );

-- 3. VERIFY
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE tablename IN ('tashih_records', 'jurnal_records') 
ORDER BY tablename, cmd;
