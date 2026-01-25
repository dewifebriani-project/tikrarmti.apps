-- ============================================================================
-- TEMPORARY FIX - Disable RLS for all critical tables
-- ============================================================================
-- This allows login and dashboard to work while we fix RLS policies properly
-- ============================================================================

-- Disable RLS for all critical tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pendaftaran_tikrar_tahfidz DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daftar_ulang_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.halaqah DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ujian_tahfidz DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tashih_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.halaqah_classes DISABLE ROW LEVEL SECURITY;

-- Verification - Show RLS status
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users',
    'pendaftaran_tikrar_tahfidz',
    'daftar_ulang_submissions',
    'halaqah',
    'programs',
    'batches',
    'ujian_tahfidz',
    'tashih_records',
    'halaqah_classes'
  )
ORDER BY tablename;
