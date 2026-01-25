-- ============================================================================
-- Diagnose: daftar_ulang_submissions RLS insert error
-- Replace 'USER_EMAIL_HERE' with the actual email that's failing
-- ============================================================================

-- 1. Get user ID and their registration
WITH user_info AS (
  SELECT
    u.id as user_id,
    u.email,
    u.role,
    p.id as registration_id,
    p.chosen_juz,
    p.selection_status,
    p.batch_id
  FROM users u
  INNER JOIN pendaftaran_tikrar_tahfidz p ON p.user_id = u.id
  WHERE u.email = 'USER_EMAIL_HERE'  -- REPLACE THIS
    AND p.selection_status = 'selected'
  ORDER BY p.created_at DESC
  LIMIT 1
)
SELECT * FROM user_info;

-- 2. Check if there's already a submission for this user/registration
WITH user_info AS (
  SELECT
    u.id as user_id,
    u.email,
    p.id as registration_id
  FROM users u
  INNER JOIN pendaftaran_tikrar_tahfidz p ON p.user_id = u.id
  WHERE u.email = 'USER_EMAIL_HERE'  -- REPLACE THIS
    AND p.selection_status = 'selected'
  ORDER BY p.created_at DESC
  LIMIT 1
)
SELECT
  'Existing submissions' as check_type,
  s.*
FROM user_info ui
LEFT JOIN daftar_ulang_submissions s ON s.user_id = ui.user_id AND s.registration_id = ui.registration_id;

-- 3. Test the INSERT policy condition
-- This simulates what the RLS policy checks
WITH user_info AS (
  SELECT
    u.id as user_id,
    u.email,
    p.id as registration_id
  FROM users u
  INNER JOIN pendaftaran_tikrar_tahfidz p ON p.user_id = u.id
  WHERE u.email = 'USER_EMAIL_HERE'  -- REPLACE THIS
    AND p.selection_status = 'selected'
  ORDER BY p.created_at DESC
  LIMIT 1
)
SELECT
  'INSERT policy check' as check_type,
  ui.user_id,
  ui.registration_id,
  -- The policy checks: user_id = auth.uid()
  -- Assuming auth.uid() would be ui.user_id
  CASE
    WHEN ui.user_id IS NOT NULL THEN 'PASS - user_id exists'
    ELSE 'FAIL - user_id is NULL'
  END as user_id_check,
  -- Check if registration exists and belongs to user
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM pendaftaran_tikrar_tahfidz p
      WHERE p.id = ui.registration_id
        AND p.user_id = ui.user_id
        AND p.selection_status = 'selected'
    ) THEN 'PASS - registration belongs to user'
    ELSE 'FAIL - registration does not belong to user or not selected'
  END as registration_check
FROM user_info ui;

-- 4. Show all RLS policies on daftar_ulang_submissions
SELECT
  'RLS Policies' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  pg_get_expr(qual, policy::regclass::oid) as using_expression,
  pg_get_expr(with_check, policy::regclass::oid) as check_expression
FROM pg_policies
WHERE tablename = 'daftar_ulang_submissions'
ORDER BY cmd, policyname;

-- 5. Check if there are any conflicting policies
-- Multiple INSERT policies with "restrictive" (permissive=false) could cause issues
SELECT
  'Policy conflicts' as check_type,
  cmd,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as policy_names,
  BOOL_AND(permissive) as all_permissive,
  BOOL_AND(NOT permissive) as has_restrictive
FROM pg_policies
WHERE tablename = 'daftar_ulang_submissions' AND cmd = 'INSERT'
GROUP BY cmd;
