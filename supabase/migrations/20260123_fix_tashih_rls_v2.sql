-- =====================================================
-- FIX TASHIH & JURNAL RLS - VERSION 2
-- =====================================================
-- Problem: RLS policies may be blocking INSERT because:
-- 1. There might be ID mismatch between auth.users and public.users
-- 2. Multiple overlapping policies causing conflicts
--
-- Solution:
-- 1. Drop ALL existing policies
-- 2. Create simple, clean policies using ONLY auth.uid()
-- 3. Admin policy should check public.users but with proper join
-- =====================================================

-- =====================================================
-- STEP 1: Drop ALL existing policies for tashih_records
-- =====================================================
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'tashih_records'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.tashih_records', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- =====================================================
-- STEP 2: Drop ALL existing policies for jurnal_records
-- =====================================================
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'jurnal_records'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.jurnal_records', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- =====================================================
-- STEP 3: Ensure RLS is enabled
-- =====================================================
ALTER TABLE public.tashih_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurnal_records ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: Create new SIMPLE policies for tashih_records
-- =====================================================

-- Policy 1: Users can SELECT their own records
CREATE POLICY "tashih_select_own"
  ON public.tashih_records
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Users can INSERT their own records
-- Note: This ONLY checks that user_id matches auth.uid()
CREATE POLICY "tashih_insert_own"
  ON public.tashih_records
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can UPDATE their own records
CREATE POLICY "tashih_update_own"
  ON public.tashih_records
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can DELETE their own records
CREATE POLICY "tashih_delete_own"
  ON public.tashih_records
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 5: Admin/Musyrifah can SELECT all records
-- Note: Checks public.users for role but uses auth.uid() correctly
CREATE POLICY "tashih_admin_select_all"
  ON public.tashih_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (
        u.role IN ('admin', 'musyrifah')
        OR 'admin' = ANY(u.roles)
        OR 'musyrifah' = ANY(u.roles)
      )
    )
  );

-- =====================================================
-- STEP 5: Create new SIMPLE policies for jurnal_records
-- =====================================================

-- Policy 1: Users can SELECT their own records
CREATE POLICY "jurnal_select_own"
  ON public.jurnal_records
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Users can INSERT their own records
CREATE POLICY "jurnal_insert_own"
  ON public.jurnal_records
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can UPDATE their own records
CREATE POLICY "jurnal_update_own"
  ON public.jurnal_records
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can DELETE their own records
CREATE POLICY "jurnal_delete_own"
  ON public.jurnal_records
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 5: Admin/Musyrifah can SELECT all records
CREATE POLICY "jurnal_admin_select_all"
  ON public.jurnal_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (
        u.role IN ('admin', 'musyrifah')
        OR 'admin' = ANY(u.roles)
        OR 'musyrifah' = ANY(u.roles)
      )
    )
  );

-- =====================================================
-- STEP 6: Grant necessary permissions
-- =====================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tashih_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jurnal_records TO authenticated;

-- =====================================================
-- STEP 7: Verify the fix
-- =====================================================
SELECT
  tablename,
  policyname,
  cmd,
  roles::text
FROM pg_policies
WHERE tablename IN ('tashih_records', 'jurnal_records')
ORDER BY tablename, policyname;

-- =====================================================
-- DEBUG QUERIES (run these to diagnose issues)
-- =====================================================

-- Check if user IDs match between auth.users and public.users
-- SELECT
--   'auth.users' as source, au.id, au.email
-- FROM auth.users au
-- WHERE au.email = 'your-email@example.com'
-- UNION ALL
-- SELECT
--   'public.users' as source, pu.id, pu.email
-- FROM public.users pu
-- WHERE pu.email = 'your-email@example.com';

-- Test INSERT as current user (should work for thalibah)
-- INSERT INTO public.tashih_records (user_id, blok, lokasi, waktu_tashih)
-- VALUES (auth.uid(), 'TEST', 'mti', NOW());
