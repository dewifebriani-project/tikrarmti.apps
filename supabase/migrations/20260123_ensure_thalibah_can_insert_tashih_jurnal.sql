-- =====================================================
-- ENSURE THALIBAH CAN INSERT TASHIH AND JURNAL RECORDS
-- =====================================================
-- Purpose: Fix RLS violation for thalibah role when inserting
--          tashih_records and jurnal_records
-- Created: 2026-01-23
-- =====================================================

-- =====================================================
-- 1. DROP ALL EXISTING POLICIES FIRST (CLEAN SLATE)
-- =====================================================

-- Drop tashih_records policies
DROP POLICY IF EXISTS "Users can view own tashih records" ON public.tashih_records;
DROP POLICY IF EXISTS "Users can insert own tashih records" ON public.tashih_records;
DROP POLICY IF EXISTS "Users can update own tashih records" ON public.tashih_records;
DROP POLICY IF EXISTS "Users can delete own tashih records" ON public.tashih_records;
DROP POLICY IF EXISTS "Admins can view all tashih records" ON public.tashih_records;
DROP POLICY IF EXISTS "Admins and Musyrifah can view all tashih records" ON public.tashih_records;
DROP POLICY IF EXISTS "Authenticated users can manage own tashih records" ON public.tashih_records;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.tashih_records;

-- Drop jurnal_records policies
DROP POLICY IF EXISTS "Users can view own jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Users can insert own jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Users can update own jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Users can delete own jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Admins can view all jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Admins and Musyrifah can view all jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Authenticated users can manage own jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.jurnal_records;

-- =====================================================
-- 2. CREATE NEW POLICIES FOR TASHIH_RECORDS
-- =====================================================

-- SELECT: Users can view own records
CREATE POLICY "Users can view own tashih records"
  ON public.tashih_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Users can insert own records
CREATE POLICY "Users can insert own tashih records"
  ON public.tashih_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update own records
CREATE POLICY "Users can update own tashih records"
  ON public.tashih_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete own records
CREATE POLICY "Users can delete own tashih records"
  ON public.tashih_records FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- SELECT: Admins and Musyrifah can view all records
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
-- 3. CREATE NEW POLICIES FOR JURNAL_RECORDS
-- =====================================================

-- SELECT: Users can view own records
CREATE POLICY "Users can view own jurnal records"
  ON public.jurnal_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Users can insert own records
CREATE POLICY "Users can insert own jurnal records"
  ON public.jurnal_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update own records
CREATE POLICY "Users can update own jurnal records"
  ON public.jurnal_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete own records
CREATE POLICY "Users can delete own jurnal records"
  ON public.jurnal_records FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- SELECT: Admins and Musyrifah can view all records
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
-- 4. ENSURE RLS IS ENABLED
-- =====================================================

ALTER TABLE public.tashih_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurnal_records ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. GRANT EXPLICIT PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tashih_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jurnal_records TO authenticated;

-- =====================================================
-- 6. ADD SEQUENCE PERMISSIONS (FOR ID GENERATION)
-- =====================================================

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- 7. VERIFY POLICIES ARE ACTIVE
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

  IF tashih_policy_count < 5 THEN
    RAISE EXCEPTION 'Expected at least 5 policies on tashih_records, got %', tashih_policy_count;
  END IF;

  IF jurnal_policy_count < 5 THEN
    RAISE EXCEPTION 'Expected at least 5 policies on jurnal_records, got %', jurnal_policy_count;
  END IF;
END $$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================

-- Verification queries (run these after migration to verify):

-- Check all RLS policies for tashih_records
/*
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tashih_records'
ORDER BY policyname;
*/

-- Check all RLS policies for jurnal_records
/*
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'jurnal_records'
ORDER BY policyname;
*/

-- Test as a thalibah user (replace with actual user_id):
/*
-- Test INSERT for tashih_records
INSERT INTO public.tashih_records (user_id, blok, lokasi, masalah_tajwid, waktu_tashih)
VALUES ('<user_id>', 'H1A', 'mti', ARRAY['makhroj'], NOW());

-- Test INSERT for jurnal_records
INSERT INTO public.jurnal_records (user_id, tanggal_jurnal, tanggal_setor, tashih_completed)
VALUES ('<user_id>', CURRENT_DATE, CURRENT_DATE, true);
*/
