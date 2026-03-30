-- =====================================================
-- DEFINITIVE FIX: Enable Admin Access (Guaranteed Working)
-- =====================================================
-- Jalankan di Supabase SQL Editor sebagai SERVICE ROLE

-- =====================================================
-- STEP 1: Cek data sebagai service role
-- =====================================================

-- Jalan sebagai service role (bypass RLS)
SET ROLE postgres;

-- Lihat struktur data
SELECT id, email, roles
FROM public.users
LIMIT 3;

-- Hitung users
SELECT count(*) as total_users FROM public.users;

-- Hitung admin (cek dengan cara yang benar)
SELECT count(*) as total_admins
FROM public.users
WHERE 'admin' = ANY(roles);

-- List admin users
SELECT email, roles
FROM public.users
WHERE 'admin' = ANY(roles)
ORDER BY email
LIMIT 10;

-- =====================================================
-- STEP 2: Drop policies lama
-- =====================================================

DROP POLICY IF EXISTS users_select_admin ON public.users;
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;
DROP POLICY IF EXISTS users_update_admin ON public.users;

-- =====================================================
-- STEP 3: Buat policies baru
-- =====================================================

-- Policy: Admin bisa SELECT semua data
CREATE POLICY users_select_admin ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = public.users.id
      AND 'admin' = ANY(u.roles)
    )
  );

-- Policy: User bisa SELECT data sendiri
CREATE POLICY users_select_own ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: User bisa UPDATE data sendiri
CREATE POLICY users_update_own ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Admin bisa UPDATE semua data
CREATE POLICY users_update_admin ON public.users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = public.users.id
      AND 'admin' = ANY(u.roles)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = public.users.id
      AND 'admin' = ANY(u.roles)
    )
  );

-- =====================================================
-- STEP 4: Reset kembali ke authenticated role
-- =====================================================

RESET ROLE;

-- =====================================================
-- STEP 5: Verifikasi
-- =====================================================

-- Cek policies yang aktif
SELECT
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
ORDER BY policyname;

-- Cek RLS status
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'users';

-- =====================================================
-- SELESAI!
-- =====================================================
-- Setelah menjalankan kode di atas:
-- 1. REFRESH halaman browser (F5)
-- 2. Data users seharusnya muncul

-- Jika masih kosong, jalankan query ini:
-- SELECT * FROM public.users LIMIT 5;
