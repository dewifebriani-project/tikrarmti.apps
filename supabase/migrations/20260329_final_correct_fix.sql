-- =====================================================
-- FINAL CORRECT FIX: Admin Access Policy
-- =====================================================
-- Copy PASTE SELURUH KODE INI ke Supabase SQL Editor
-- Lalu klik tombol Run

-- =====================================================
-- STEP 1: Drop POLICY YANG SALAH
-- =====================================================

DROP POLICY IF EXISTS users_select_admin ON public.users;
DROP POLICY IF EXISTS users_update_admin ON public.users;

-- =====================================================
-- STEP 2: Verify current user
-- =====================================================

SELECT
  auth.uid() as current_user_id,
  (SELECT email FROM public.users WHERE id = auth.uid()) as your_email,
  (SELECT roles FROM public.users WHERE id = auth.uid()) as your_roles,
  (SELECT 'admin' = ANY(roles) FROM public.users WHERE id = auth.uid()) as is_admin;

-- =====================================================
-- STEP 3: Create correct policies using is_admin() function
-- =====================================================

-- First, ensure is_admin() function exists and works
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
    AND 'admin' = ANY(roles)
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Admins can SELECT all users
CREATE POLICY users_select_admin ON public.users
  FOR SELECT
  USING (public.is_admin());

-- Admins can UPDATE all users
CREATE POLICY users_update_admin ON public.users
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- STEP 4: Verification
-- =====================================================

-- Test is_admin() function
SELECT public.is_admin() as test_is_admin_function;

-- Check all policies on users table
SELECT
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
ORDER BY policyname;

-- Count total users (using service role bypass)
SET LOCAL role TO postgres;
SELECT count(*) as total_users_from_service_role FROM public.users;
RESET LOCAL ROLE;

-- =====================================================
-- STEP 5: Diagnostics - check if you can see users
-- =====================================================

-- This should return users if you're admin
SELECT count(*) as users_you_can_see
FROM public.users;

-- =====================================================
-- DONE!
-- =====================================================
-- Setelah menjalankan kode di atas:
-- 1. REFRESH halaman browser (F5)
-- 2. Jika masih kosong, LOGOUT lalu LOGIN kembali
-- 3. Data users seharusnya sudah muncul
