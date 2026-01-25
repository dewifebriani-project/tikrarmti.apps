-- Verify RLS Policy Fix and Check User Data
-- Run this to confirm everything is ready for testing

-- 1. Check UPDATE policies (should be exactly 1)
SELECT
    '=== UPDATE POLICIES ===' as section,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'pendaftaran_tikrar_tahfidz'
  AND cmd = 'UPDATE';

-- 2. Show the UPDATE policy details
SELECT
    policyname,
    cmd,
    roles::text,
    qual::text as using_clause,
    with_check::text
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'pendaftaran_tikrar_tahfidz'
  AND cmd = 'UPDATE';

-- 3. Check if there are any approved users with registration data
SELECT
    '=== APPROVED USERS ===' as section,
    COUNT(*) as total_approved_users,
    COUNT(CASE WHEN oral_submission_url IS NOT NULL THEN 1 END) as users_with_submission,
    COUNT(CASE WHEN oral_submission_url IS NULL THEN 1 END) as users_without_submission
FROM public.pendaftaran_tikrar_tahfidz
WHERE status = 'approved';

-- 4. Sample of approved users (without sensitive info)
SELECT
    id,
    SUBSTRING(email, 1, 3) || '***' || SUBSTRING(email, POSITION('@' IN email)) as masked_email,
    status,
    CASE
        WHEN oral_submission_url IS NOT NULL THEN 'YES - Already submitted'
        ELSE 'NO - Can test upload'
    END as has_oral_submission,
    created_at,
    updated_at
FROM public.pendaftaran_tikrar_tahfidz
WHERE status = 'approved'
ORDER BY created_at DESC
LIMIT 5;
