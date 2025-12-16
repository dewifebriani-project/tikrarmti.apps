-- Script untuk debug kenapa card dashboard tidak muncul untuk sebagian users
-- Jalankan di Supabase SQL Editor

-- 1. Cek apakah ada batch dengan status 'open'
SELECT
    id,
    name,
    status,
    start_date,
    end_date,
    is_free,
    price,
    total_quota,
    created_at
FROM batches
WHERE status = 'open'
ORDER BY created_at DESC;

-- 2. Jika tidak ada hasil, lihat semua batches
SELECT
    id,
    name,
    status,
    start_date,
    end_date,
    created_at
FROM batches
ORDER BY created_at DESC
LIMIT 10;

-- 3. Update batch menjadi 'open' jika diperlukan (uncomment jika mau jalankan)
-- UPDATE batches
-- SET status = 'open'
-- WHERE name ILIKE '%Tikrar%Tahfidz%Batch%2%'
-- RETURNING id, name, status;

-- 4. Cek RLS policies untuk batches (harus ada batches_select_all)
SELECT
    policyname,
    cmd as command,
    roles,
    qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'batches'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- 5. Test query sebagai authenticated user (simulate dashboard query)
-- Ini akan error jika RLS policy tidak mengizinkan
SELECT *
FROM batches
WHERE status = 'open'
ORDER BY created_at DESC
LIMIT 1;
