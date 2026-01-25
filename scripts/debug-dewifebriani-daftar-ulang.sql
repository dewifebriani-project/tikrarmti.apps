-- ============================================================================
-- Debug: dewifebriani@tazkia.ac.id - daftar_ulang_submissions INSERT error
-- ============================================================================

-- 1. Get user info and registration details
WITH user_info AS (
  SELECT
    u.id as user_id,
    u.email,
    u.role,
    p.id as registration_id,
    p.chosen_juz,
    p.exam_score,
    p.selection_status,
    p.batch_id,
    p.full_name,
    p.main_time_slot,
    p.backup_time_slot,
    p.wa_phone,
    p.address,
    p.re_enrollment_completed
  FROM users u
  INNER JOIN pendaftaran_tikrar_tahfidz p ON p.user_id = u.id
  WHERE u.email = 'dewifebriani@tazkia.ac.id'
    AND p.selection_status = 'selected'
  ORDER BY p.created_at DESC
  LIMIT 1
)
SELECT * FROM user_info;

-- 2. Check if there's already a submission for this user
WITH user_info AS (
  SELECT
    u.id as user_id,
    u.email,
    p.id as registration_id
  FROM users u
  INNER JOIN pendaftaran_tikrar_tahfidz p ON p.user_id = u.id
  WHERE u.email = 'dewifebriani@tazkia.ac.id'
    AND p.selection_status = 'selected'
  ORDER BY p.created_at DESC
  LIMIT 1
)
SELECT
  'Existing submissions' as check_type,
  s.id,
  s.user_id,
  s.registration_id,
  s.status,
  s.partner_type,
  s.ujian_halaqah_id,
  s.tashih_halaqah_id,
  s.submitted_at,
  s.created_at
FROM user_info ui
LEFT JOIN daftar_ulang_submissions s ON s.user_id = ui.user_id AND s.registration_id = ui.registration_id;

-- 3. Check all RLS policies on daftar_ulang_submissions
SELECT
  '=== All RLS Policies ===' as section,
  policyname,
  cmd,
  permissive,
  pg_get_expr(qual, 'daftar_ulang_submissions'::regclass) as using_expression,
  pg_get_expr(with_check, 'daftar_ulang_submissions'::regclass) as with_check_expression
FROM pg_policies
WHERE tablename = 'daftar_ulang_submissions'
ORDER BY cmd, policyname;

-- 4. Simulate INSERT policy check for this user
WITH user_info AS (
  SELECT
    u.id as user_id,
    u.email,
    p.id as registration_id,
    p.batch_id
  FROM users u
  INNER JOIN pendaftaran_tikrar_tahfidz p ON p.user_id = u.id
  WHERE u.email = 'dewifebriani@tazkia.ac.id'
    AND p.selection_status = 'selected'
  ORDER BY p.created_at DESC
  LIMIT 1
)
SELECT
  'INSERT Policy Simulation' as check_type,
  ui.user_id,
  ui.registration_id,
  ui.batch_id,
  -- The policy checks: user_id = auth.uid()
  -- Assuming auth.uid() would return ui.user_id
  CASE
    WHEN ui.user_id IS NOT NULL THEN 'PASS - user_id exists and would match auth.uid()'
    ELSE 'FAIL - user_id is NULL'
  END as user_id_check,
  -- Additional checks that might be needed
  CASE
    WHEN ui.registration_id IS NOT NULL THEN 'PASS - registration_id exists'
    ELSE 'FAIL - registration_id is NULL'
  END as registration_id_check,
  CASE
    WHEN ui.batch_id IS NOT NULL THEN 'PASS - batch_id exists'
    ELSE 'FAIL - batch_id is NULL'
  END as batch_id_check
FROM user_info ui;

-- 5. Check the table structure to ensure all required fields are present
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'daftar_ulang_submissions'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Check for any constraints that might block INSERT
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'daftar_ulang_submissions'::regclass
ORDER BY contype, conname;

-- 7. Test if user can actually SEE the table (RLS SELECT check)
SET ROLE authenticated; -- Simulate authenticated user role

-- This would be the query the app runs to check for existing submission
-- (commented out as we can't SET ROLE with specific user_id this way)
-- SELECT id FROM daftar_ulang_submissions
-- WHERE user_id = 'USER_ID_FROM_STEP_1'
--   AND registration_id = 'REGISTRATION_ID_FROM_STEP_1';

RESET ROLE;

-- 8. Check auth.users table to verify user exists in auth schema
SELECT
  'Auth user check' as check_type,
  id,
  email,
  created_at,
  last_sign_in_at,
  raw_app_meta_data->>'provider' as provider,
  raw_user_meta_data
FROM auth.users
WHERE email = 'dewifebriani@tazkia.ac.id';

-- 9. Verify the user ID matches between auth.users and public.users
SELECT
  'User ID match check' as check_type,
  au.id as auth_user_id,
  au.email as auth_email,
  pu.id as public_user_id,
  pu.email as public_email,
  pu.role,
  CASE
    WHEN au.id = pu.id THEN 'MATCH - User IDs are identical'
    ELSE 'MISMATCH - User IDs are different!'
  END as status,
  CASE
    WHEN au.email = pu.email THEN 'MATCH - Emails are identical'
    ELSE 'MISMATCH - Emails are different!'
  END as email_status
FROM auth.users au
LEFT JOIN public.users pu ON pu.email = au.email
WHERE au.email = 'dewifebriani@tazkia.ac.id';

-- 10. Get batch info for this user
WITH user_info AS (
  SELECT
    u.id as user_id,
    p.batch_id
  FROM users u
  INNER JOIN pendaftaran_tikrar_tahfidz p ON p.user_id = u.id
  WHERE u.email = 'dewifebriani@tazkia.ac.id'
    AND p.selection_status = 'selected'
  ORDER BY p.created_at DESC
  LIMIT 1
)
SELECT
  b.id,
  b.name,
  b.status as batch_status,
  b.re_enrollment_date,
  b.opening_class_date
FROM user_info ui
INNER JOIN batches b ON b.id = ui.batch_id;
