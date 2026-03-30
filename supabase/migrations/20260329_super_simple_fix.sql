-- =====================================================
-- SUPER SIMPLE FIX: Temporary disable RLS for testing
-- =====================================================
-- INSTRUKSI:
-- 1. Copy paste kode ini ke Supabase SQL Editor
-- 2. Klik Run
-- 3. Lihat hasil di bawah
-- 4. Refresh halaman browser Anda

-- =====================================================
-- CEK DATA ADMIN
-- =====================================================

-- Lihat semua admin users
SELECT
  id,
  email,
  roles
FROM public.users
WHERE 'admin' = ANY(roles)
ORDER BY email
LIMIT 10;

-- Hitung total users
SELECT count(*) as total_users FROM public.users;

-- =====================================================
-- CEK CURRENT USER
-- =====================================================

-- Cek user yang sedang login
SELECT
  auth.uid() as current_user_id,
  (SELECT email FROM public.users WHERE id = auth.uid()) as your_email,
  (SELECT roles FROM public.users WHERE id = auth.uid()) as your_roles,
  (SELECT 'admin' = ANY(roles) FROM public.users WHERE id = auth.uid()) as is_admin;

-- =====================================================
-- FIX RLS POLICIES (SIMPLE VERSION)
-- =====================================================

-- Hapus policies lama
DROP POLICY IF EXISTS users_select_admin ON public.users;
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;

-- Policy: Admin bisa lihat semua data
CREATE POLICY users_select_admin ON public.users
  FOR SELECT
  USING (
    -- Cek apakah user memiliki role admin di database
    'admin' = ANY (
      SELECT roles
      FROM public.users
      WHERE id = auth.uid()
    )
  );

-- Policy: User bisa lihat data sendiri
CREATE POLICY users_select_own ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- =====================================================
-- VERIFIKASI
-- =====================================================

-- Cek policies yang aktif
SELECT
  policyname,
  cmd,
  roles,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
ORDER BY policyname;

-- Cek apakah RLS aktif
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'users';
