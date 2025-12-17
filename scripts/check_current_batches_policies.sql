-- Query untuk melihat semua RLS policies yang aktif pada tabel batches
-- Jalankan ini di Supabase SQL Editor untuk melihat policy yang sedang aktif

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'batches'
ORDER BY policyname;

-- Query tambahan: Check apakah RLS enabled
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'batches';
