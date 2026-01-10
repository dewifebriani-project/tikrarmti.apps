-- ============================================================================
-- Debug: Check muallimah who also registered as thalibah
-- Replace 'USER_EMAIL_HERE' with the actual email
-- ============================================================================

-- 1. Check if user exists in auth.users
SELECT
    'AUTH USER' as source,
    id as user_id,
    email,
    created_at
FROM auth.users
WHERE email = 'USER_EMAIL_HERE';  -- REPLACE THIS

-- 2. Check muallimah registrations
SELECT
    'MUALLIMAH REG' as source,
    id,
    user_id,
    email,
    full_name,
    status,
    batch_id,
    submitted_at
FROM muallimah_registrations
WHERE email = 'USER_EMAIL_HERE'  -- REPLACE THIS
ORDER BY submitted_at DESC;

-- 3. Check thalibah registrations by user_id
WITH user_info AS (
    SELECT id FROM auth.users WHERE email = 'USER_EMAIL_HERE'  -- REPLACE THIS
)
SELECT
    'THALIBAH REG (by user_id)' as source,
    p.id,
    p.user_id,
    p.email,
    p.full_name,
    p.selection_status,
    p.batch_id,
    p.chosen_juz,
    p.exam_score,
    p.created_at
FROM pendaftaran_tikrar_tahfidz p
CROSS JOIN user_info u
WHERE p.user_id = u.id
ORDER BY p.created_at DESC;

-- 4. Check thalibah registrations by email (fallback)
SELECT
    'THALIBAH REG (by email)' as source,
    id,
    user_id,
    email,
    full_name,
    selection_status,
    batch_id,
    chosen_juz,
    exam_score,
    created_at
FROM pendaftaran_tikrar_tahfidz
WHERE email ILIKE 'USER_EMAIL_HERE'  -- REPLACE THIS
ORDER BY created_at DESC;

-- 5. Check if there's user_id mismatch
SELECT
    'MISMATCH CHECK' as source,
    u.id as auth_user_id,
    u.email as auth_email,
    p.user_id as reg_user_id,
    p.email as reg_email,
    CASE
        WHEN u.id = p.user_id THEN 'MATCH'
        ELSE 'MISMATCH'
    END as status
FROM auth.users u
LEFT JOIN pendaftaran_tikrar_tahfidz p ON p.email ILIKE u.email
WHERE u.email = 'USER_EMAIL_HERE';  -- REPLACE THIS

-- 6. Summary: What's the problem?
WITH user_info AS (
    SELECT id, email FROM auth.users WHERE email = 'USER_EMAIL_HERE'  -- REPLACE THIS
)
SELECT
    'DIAGNOSIS' as type,
    CASE
        WHEN NOT EXISTS (SELECT 1 FROM user_info) THEN 'User not found in auth.users'
        WHEN NOT EXISTS (
            SELECT 1 FROM pendaftaran_tikrar_tahfidz p, user_info u
            WHERE p.user_id = u.id OR p.email ILIKE u.email
        ) THEN 'No thalibah registration found (neither by user_id nor email)'
        WHEN NOT EXISTS (
            SELECT 1 FROM pendaftaran_tikrar_tahfidz p, user_info u
            WHERE (p.user_id = u.id OR p.email ILIKE u.email)
            AND p.selection_status = 'selected'
        ) THEN 'Thalibah registration exists but selection_status is not "selected"'
        WHEN EXISTS (
            SELECT 1 FROM pendaftaran_tikrar_tahfidz p, user_info u
            WHERE p.email ILIKE u.email AND p.user_id != u.id
        ) THEN 'user_id mismatch between auth.users and pendaftaran_tikrar_tahfidz'
        ELSE 'Everything looks OK - user should have access'
    END as diagnosis;
