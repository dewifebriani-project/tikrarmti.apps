-- =====================================================
-- COMPLETE FIX FOR TASHIH RLS ISSUE
-- =====================================================
-- Jalankan script ini di Supabase SQL Editor
-- =====================================================

-- =====================================================
-- STEP 1: CEK USER THALIBAH YANG BERMASALAH
-- =====================================================
-- Ini menunjukkan thalibah yang ada di auth.users tapi tidak ada di public.users

SELECT
  'THALIBAH TANPA PROFILE' as issue,
  au.id as auth_id,
  au.email,
  au.created_at as auth_created
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
AND au.email IN (
  -- Ganti dengan email thalibah yang bermasalah
  SELECT DISTINCT p.email
  FROM public.pendaftaran_tikrar_tahfidz p
  WHERE p.selection_status = 'selected'
);

-- =====================================================
-- STEP 2: CEK APAKAH USER YANG LOGIN PUNYA RECORD DI PUBLIC.USERS
-- =====================================================
-- Cek specific user yang mengalami error (ganti email)
/*
SELECT
  au.id as auth_id,
  au.email as auth_email,
  pu.id as public_id,
  pu.email as public_email,
  pu.roles,
  CASE WHEN au.id = pu.id THEN 'ID MATCH' ELSE 'ID MISMATCH!' END as id_status,
  CASE WHEN pu.id IS NULL THEN 'NO PROFILE!' ELSE 'HAS PROFILE' END as profile_status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'email_thalibah@example.com';  -- GANTI EMAIL INI
*/

-- =====================================================
-- STEP 3: DROP ALL EXISTING RLS POLICIES
-- =====================================================
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop policies for tashih_records
    FOR policy_record IN
        SELECT policyname FROM pg_policies WHERE tablename = 'tashih_records'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.tashih_records', policy_record.policyname);
        RAISE NOTICE 'Dropped tashih policy: %', policy_record.policyname;
    END LOOP;

    -- Drop policies for jurnal_records
    FOR policy_record IN
        SELECT policyname FROM pg_policies WHERE tablename = 'jurnal_records'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.jurnal_records', policy_record.policyname);
        RAISE NOTICE 'Dropped jurnal policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- =====================================================
-- STEP 4: ENABLE RLS
-- =====================================================
ALTER TABLE public.tashih_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurnal_records ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: CREATE SIMPLE RLS POLICIES FOR TASHIH_RECORDS
-- =====================================================

-- SELECT: User can view own records
CREATE POLICY "tashih_select_own"
ON public.tashih_records FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: User can insert own records
CREATE POLICY "tashih_insert_own"
ON public.tashih_records FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: User can update own records
CREATE POLICY "tashih_update_own"
ON public.tashih_records FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: User can delete own records
CREATE POLICY "tashih_delete_own"
ON public.tashih_records FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- SELECT ALL: Admin/Musyrifah can view all
CREATE POLICY "tashih_admin_select_all"
ON public.tashih_records FOR SELECT
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
-- STEP 6: CREATE SIMPLE RLS POLICIES FOR JURNAL_RECORDS
-- =====================================================

-- SELECT: User can view own records
CREATE POLICY "jurnal_select_own"
ON public.jurnal_records FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: User can insert own records
CREATE POLICY "jurnal_insert_own"
ON public.jurnal_records FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: User can update own records
CREATE POLICY "jurnal_update_own"
ON public.jurnal_records FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: User can delete own records
CREATE POLICY "jurnal_delete_own"
ON public.jurnal_records FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- SELECT ALL: Admin/Musyrifah can view all
CREATE POLICY "jurnal_admin_select_all"
ON public.jurnal_records FOR SELECT
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
-- STEP 7: GRANT PERMISSIONS
-- =====================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tashih_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jurnal_records TO authenticated;

-- =====================================================
-- STEP 8: VERIFY POLICIES
-- =====================================================
SELECT
  tablename,
  policyname,
  cmd,
  roles::text
FROM pg_policies
WHERE tablename IN ('tashih_records', 'jurnal_records')
ORDER BY tablename, cmd, policyname;

-- =====================================================
-- TEST: Simulasi insert (uncomment untuk test)
-- =====================================================
/*
-- Test sebagai user tertentu (ganti UUID dengan auth.uid() user yang bermasalah)
-- INSERT INTO public.tashih_records (user_id, blok, lokasi, waktu_tashih)
-- VALUES ('USER_UUID_HERE', 'TEST', 'mti', NOW())
-- RETURNING id, user_id;

-- Kemudian hapus test record
-- DELETE FROM public.tashih_records WHERE blok = 'TEST';
*/
