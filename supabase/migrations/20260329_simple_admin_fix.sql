-- =====================================================
-- SIMPLIFIED FIX: Enable Admin Access to Users Table
-- =====================================================
-- Copy PASTE SELURUH KODE INI ke Supabase SQL Editor
-- Lalu klik tombol Run

-- =====================================================
-- STEP 1: Create is_admin() function (FIXED)
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
    AND 'admin' = ANY(roles)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- =====================================================
-- STEP 2: Check if you are admin
-- =====================================================

SELECT
  public.is_admin() as is_admin_user,
  (SELECT email FROM public.users WHERE id = auth.uid()) as your_email,
  (SELECT roles FROM public.users WHERE id = auth.uid()) as your_roles;

-- =====================================================
-- STEP 3: Recreate users policies
-- =====================================================

DROP POLICY IF EXISTS users_select_admin ON public.users;
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;

CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY users_select_admin ON public.users
  FOR SELECT USING (public.is_admin());

CREATE POLICY users_update_admin ON public.users
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =====================================================
-- STEP 4: Verify all admin users
-- =====================================================

SELECT
  count(*) as total_admins,
  string_agg(email, ', ') as admin_emails
FROM public.users
WHERE 'admin' = ANY(roles);

-- =====================================================
-- DONE!
-- =====================================================
-- Setelah menjalankan kode di atas:
-- 1. REFRESH halaman browser (F5)
-- 2. Jika masih kosong, LOGOUT lalu LOGIN kembali
-- 3. Data users seharusnya sudah muncul

-- Untuk test query:
-- SELECT count(*) FROM public.users;
