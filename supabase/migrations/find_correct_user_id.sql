-- Find the correct user_id from auth.users for email: dewifebriani.unpad@gmail.com

-- 1. Check all users with this email in auth.users
SELECT
    '=== AUTH USERS ===' as section,
    id as auth_user_id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users
WHERE email = 'dewifebriani.unpad@gmail.com'
ORDER BY created_at;

-- 2. Check pendaftaran record
SELECT
    '=== PENDAFTARAN ===' as section,
    id as pendaftaran_id,
    user_id as current_user_id_in_pendaftaran,
    email,
    full_name,
    status,
    created_at
FROM public.pendaftaran_tikrar_tahfidz
WHERE email = 'dewifebriani.unpad@gmail.com';

-- 3. If there are multiple auth users, show which one was most recently active
SELECT
    '=== MOST ACTIVE USER ===' as section,
    id as correct_user_id_to_use,
    email,
    last_sign_in_at,
    CASE
        WHEN last_sign_in_at IS NOT NULL THEN 'This user has logged in - USE THIS ONE'
        ELSE 'Never logged in'
    END as recommendation
FROM auth.users
WHERE email = 'dewifebriani.unpad@gmail.com'
ORDER BY last_sign_in_at DESC NULLS LAST
LIMIT 1;
