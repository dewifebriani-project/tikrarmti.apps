-- Fix user_id mismatch issue
-- This will update the pendaftaran record to use the correct current user_id

-- STEP 1: First, let's see the current situation
SELECT
    '=== CURRENT USER ===' as section,
    auth.uid() as current_user_id,
    auth.email() as current_email;

SELECT
    '=== PENDAFTARAN RECORD ===' as section,
    id,
    user_id as old_user_id,
    email,
    full_name,
    status
FROM public.pendaftaran_tikrar_tahfidz
WHERE email = auth.email();

-- STEP 2: If the email matches but user_id is different,
-- we need to UPDATE the user_id in pendaftaran to match auth.uid()

-- IMPORTANT: Only run this UPDATE if you confirmed:
-- 1. The email in pendaftaran matches current user's email
-- 2. The user_id is different
-- 3. This is the same person (just logged in with different account)

-- UPDATE public.pendaftaran_tikrar_tahfidz
-- SET
--     user_id = auth.uid(),
--     updated_at = NOW()
-- WHERE email = auth.email()
--   AND user_id != auth.uid();

-- After running UPDATE, verify:
-- SELECT
--     '=== AFTER UPDATE ===' as section,
--     id,
--     user_id,
--     email,
--     status
-- FROM public.pendaftaran_tikrar_tahfidz
-- WHERE email = auth.email();
