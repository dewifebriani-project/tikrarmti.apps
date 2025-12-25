-- Compare current logged-in user_id with users in pendaftaran table

-- 1. Show current authenticated user
SELECT
    '=== CURRENTLY LOGGED IN USER ===' as section,
    auth.uid() as current_user_id,
    auth.email() as current_email;

-- 2. Show all approved users from pendaftaran table
SELECT
    '=== APPROVED USERS IN PENDAFTARAN ===' as section,
    id as registration_id,
    user_id,
    SUBSTRING(email, 1, 3) || '***' || SUBSTRING(email, POSITION('@' IN email)) as masked_email,
    status
FROM public.pendaftaran_tikrar_tahfidz
WHERE status = 'approved'
ORDER BY created_at DESC;

-- 3. Check if current user exists in pendaftaran (should show if match exists)
SELECT
    '=== DOES CURRENT USER HAVE REGISTRATION? ===' as section,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM public.pendaftaran_tikrar_tahfidz
            WHERE user_id = auth.uid()
        ) THEN 'YES - User has registration'
        ELSE 'NO - User does NOT have registration (mismatch or missing)'
    END as has_registration;

-- 4. If user email matches, show the mismatch
SELECT
    '=== CHECKING EMAIL MATCH ===' as section,
    p.id,
    p.user_id as pendaftaran_user_id,
    auth.uid() as current_auth_uid,
    p.email as pendaftaran_email,
    auth.email() as current_auth_email,
    CASE
        WHEN p.user_id = auth.uid() THEN 'MATCH - IDs are same'
        ELSE 'MISMATCH - Different user_ids!'
    END as id_status
FROM public.pendaftaran_tikrar_tahfidz p
WHERE p.email = auth.email()
   OR p.user_id = auth.uid();
