-- ============================================================================
-- Verify if user IDs match between auth.users and public.users
-- ============================================================================

-- 1. Check if there are multiple users with same email
SELECT
  '=== CHECK FOR DUPLICATE EMAILS ===' as section,
  'auth.users' as table_name,
  email,
  COUNT(*) as count
FROM auth.users
WHERE email = 'dewifebriani@tazkia.ac.id'
GROUP BY email

UNION ALL

SELECT
  '=== CHECK FOR DUPLICATE EMAILS ===' as section,
  'public.users' as table_name,
  email,
  COUNT(*) as count
FROM public.users
WHERE email = 'dewifebriani@tazkia.ac.id'
GROUP BY email;

-- 2. Get the user IDs from both tables
WITH auth_user AS (
  SELECT id, email FROM auth.users WHERE email = 'dewifebriani@tazkia.ac.id' LIMIT 1
),
public_user AS (
  SELECT id, email FROM public.users WHERE email = 'dewifebriani@tazkia.ac.id' LIMIT 1
)
SELECT
  '=== USER ID COMPARISON ===' as section,
  au.id as auth_user_id,
  pu.id as public_user_id,
  au.email,
  CASE
    WHEN au.id IS NULL THEN 'ERROR: User not found in auth.users'
    WHEN pu.id IS NULL THEN 'ERROR: User not found in public.users'
    WHEN au.id = pu.id THEN 'MATCH - IDs are the same'
    ELSE 'MISMATCH - IDs are different!'
  END as status,
  CASE
    WHEN au.id = pu.id THEN 'RLS should work correctly'
    ELSE 'RLS will FAIL - auth.uid() returns auth_user_id but submission has public_user_id'
  END as rls_implication
FROM auth_user au
FULL OUTER JOIN public_user pu ON pu.email = au.email;

-- 3. Check the submission directly
SELECT
  '=== SUBMISSION DETAILS ===' as section,
  id,
  user_id,
  registration_id,
  status
FROM daftar_ulang_submissions
WHERE id = 'e233b9b7-3285-4354-b71f-ba9a7344d646';
