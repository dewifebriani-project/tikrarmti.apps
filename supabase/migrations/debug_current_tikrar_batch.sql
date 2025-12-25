-- Debug script untuk cek apakah current_tikrar_batch sudah bekerja
-- Run script ini di Supabase SQL Editor

-- 1. Cek apakah kolom sudah ada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'current_tikrar_batch_id';

-- 2. Cek foreign key constraint
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'users'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'current_tikrar_batch_id';

-- 3. Cek trigger
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_set_user_tikrar_batch';

-- 4. Cek berapa users yang punya current_tikrar_batch_id
SELECT
    COUNT(*) as total_users,
    COUNT(current_tikrar_batch_id) as users_with_batch,
    COUNT(*) - COUNT(current_tikrar_batch_id) as users_without_batch
FROM users;

-- 5. Sample data - users dengan batch
SELECT
    u.id,
    u.email,
    u.full_name,
    u.current_tikrar_batch_id,
    b.name as batch_name,
    b.status as batch_status
FROM users u
LEFT JOIN batches b ON u.current_tikrar_batch_id = b.id
WHERE u.current_tikrar_batch_id IS NOT NULL
LIMIT 5;

-- 6. Cek users yang harusnya punya batch tapi belum di-set
SELECT
    u.id,
    u.email,
    u.full_name,
    u.current_tikrar_batch_id,
    p.batch_id,
    p.status,
    p.selection_status,
    b.name as batch_name
FROM users u
JOIN pendaftaran_tikrar_tahfidz p ON u.id = p.user_id
LEFT JOIN batches b ON p.batch_id = b.id
WHERE (p.status = 'approved' OR p.selection_status = 'selected')
  AND u.current_tikrar_batch_id IS NULL
LIMIT 10;

-- 7. Fix: Jika ada users yang harusnya punya batch, set sekarang
-- UNCOMMENT baris di bawah untuk run update
/*
UPDATE public.users u
SET current_tikrar_batch_id = subquery.batch_id,
    updated_at = NOW()
FROM (
  SELECT DISTINCT ON (user_id)
    user_id,
    batch_id
  FROM public.pendaftaran_tikrar_tahfidz
  WHERE (status = 'approved' OR selection_status = 'selected')
    AND user_id IS NOT NULL
    AND batch_id IS NOT NULL
  ORDER BY user_id, created_at DESC
) AS subquery
WHERE u.id = subquery.user_id;
*/

-- 8. Test query yang sama dengan API
SELECT
  id,
  email,
  full_name,
  current_tikrar_batch_id
FROM users
WHERE current_tikrar_batch_id IS NOT NULL
LIMIT 3;
