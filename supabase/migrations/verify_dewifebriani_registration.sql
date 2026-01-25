-- Verify Dewi Febriani's registration exists and is approved

-- 1. Check in auth.users
SELECT
    '=== AUTH USER ===' as section,
    id as user_id,
    email,
    email_confirmed_at,
    last_sign_in_at,
    created_at
FROM auth.users
WHERE email = 'dewifebriani.unpad@gmail.com';

-- 2. Check in pendaftaran_tikrar_tahfidz
SELECT
    '=== PENDAFTARAN ===' as section,
    id as pendaftaran_id,
    user_id,
    email,
    full_name,
    status,
    approved_by,
    approved_at,
    oral_submission_url,
    created_at,
    updated_at
FROM public.pendaftaran_tikrar_tahfidz
WHERE email = 'dewifebriani.unpad@gmail.com';

-- 3. Check if user_id matches
SELECT
    '=== ID MATCH CHECK ===' as section,
    CASE
        WHEN p.user_id = u.id THEN 'MATCH ✅ - IDs are the same'
        ELSE 'MISMATCH ❌ - user_id in pendaftaran (' || p.user_id || ') != auth.users id (' || u.id || ')'
    END as match_status,
    u.id as auth_user_id,
    p.user_id as pendaftaran_user_id,
    u.email
FROM auth.users u
LEFT JOIN public.pendaftaran_tikrar_tahfidz p ON u.email = p.email
WHERE u.email = 'dewifebriani.unpad@gmail.com';

-- 4. If mismatch, show the UPDATE statement to fix it
SELECT
    '=== FIX STATEMENT (if needed) ===' as section,
    CASE
        WHEN p.user_id != u.id THEN
            'Run this: UPDATE public.pendaftaran_tikrar_tahfidz SET user_id = ''' || u.id || ''' WHERE email = ''dewifebriani.unpad@gmail.com'';'
        ELSE 'No fix needed - IDs already match'
    END as fix_sql
FROM auth.users u
LEFT JOIN public.pendaftaran_tikrar_tahfidz p ON u.email = p.email
WHERE u.email = 'dewifebriani.unpad@gmail.com';
