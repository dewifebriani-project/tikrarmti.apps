-- =====================================================
-- DIAGNOSTIC: Check users table structure
-- =====================================================

-- Check what columns exist in the users table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Check if users table exists and has data
SELECT
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE email IS NOT NULL) as users_with_email
FROM public.users;

-- Sample a few rows to see actual structure
SELECT *
FROM public.users
LIMIT 3;

-- Check if there are any role-related columns
SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND (
    column_name LIKE '%role%'
    OR column_name LIKE '%permission%'
    OR column_name LIKE '%admin%'
  )
ORDER BY column_name;
