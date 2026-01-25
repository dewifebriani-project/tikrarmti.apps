-- Find current user's email and check if it exists in pendaftaran

-- 1. Show current user's auth info
SELECT
    '=== CURRENT USER AUTH INFO ===' as section,
    auth.uid() as user_id,
    auth.email() as email;

-- 2. Check if this email exists in pendaftaran (maybe with different user_id)
SELECT
    '=== EMAIL EXISTS IN PENDAFTARAN? ===' as section,
    p.id,
    p.user_id as pendaftaran_user_id,
    p.email,
    p.full_name,
    p.status,
    p.created_at
FROM public.pendaftaran_tikrar_tahfidz p
WHERE p.email = auth.email();

-- 3. If no match, show suggestion
SELECT
    '=== ACTION REQUIRED ===' as section,
    CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM public.pendaftaran_tikrar_tahfidz
            WHERE user_id = auth.uid()
        ) THEN 'User needs to complete pendaftaran tikrar tahfidz form first at /pendaftaran/tikrar-tahfidz'
        ELSE 'User has registration'
    END as action;
