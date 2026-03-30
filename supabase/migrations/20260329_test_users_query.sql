-- =====================================================
-- TEST: Direct query to users table
-- =====================================================

-- Test 1: Simple count
SELECT COUNT(*) as total_users FROM public.users;

-- Test 2: Get first 10 users
SELECT id, email, full_name, roles, role, is_active, is_blacklisted, created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- Test 3: Check if there are any users with specific columns
SELECT id, email FROM public.users LIMIT 5;
