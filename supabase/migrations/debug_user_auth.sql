-- Debug: Check current user authentication and registration status

-- 1. Check current authenticated user
SELECT
    '=== CURRENT USER ===' as section,
    auth.uid() as current_user_id,
    auth.email() as current_email;

-- 2. Check ALL registrations in pendaftaran_tikrar_tahfidz (to see if table has data)
SELECT
    '=== ALL REGISTRATIONS ===' as section,
    COUNT(*) as total_registrations,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN oral_submission_url IS NOT NULL THEN 1 END) as with_oral_submission
FROM public.pendaftaran_tikrar_tahfidz;

-- 3. Sample of recent registrations (masked email for privacy)
SELECT
    id,
    SUBSTRING(user_id::text, 1, 8) || '...' as masked_user_id,
    SUBSTRING(email, 1, 3) || '***' as masked_email,
    status,
    CASE WHEN oral_submission_url IS NOT NULL THEN 'YES' ELSE 'NO' END as has_oral,
    created_at
FROM public.pendaftaran_tikrar_tahfidz
ORDER BY created_at DESC
LIMIT 5;

-- 4. Check if current user exists in auth.users but not in pendaftaran
SELECT
    '=== USER EXISTS IN AUTH? ===' as section,
    CASE
        WHEN auth.uid() IS NOT NULL THEN 'YES - User is authenticated'
        ELSE 'NO - User is not authenticated'
    END as auth_status;
