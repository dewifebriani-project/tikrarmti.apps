-- ============================================================================
-- Check RLS policies for daftar_ulang_submissions table
-- ============================================================================

-- 1. Check if RLS is enabled
SELECT
  'RLS Status' as check_type,
  relname as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname = 'daftar_ulang_submissions';

-- 2. Show all RLS policies on daftar_ulang_submissions
SELECT
  'RLS Policies' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'daftar_ulang_submissions';

-- 3. Check if user can insert (simulate as a regular user)
-- First, let's see what user we're checking
DO $$
DECLARE
  v_user_id uuid := '00000000-0000-0000-0000-000000000000'::uuid; -- Replace with actual user_id to test
  v_registration_id uuid;
  v_halaqah_id uuid := '00000000-0000-0000-0000-000000000000'::uuid; -- Replace with actual halaqah_id
BEGIN
  -- Get a valid registration_id for testing
  SELECT id INTO v_registration_id
  FROM pendaftaran_tikrar_tahfidz
  WHERE user_id = v_user_id
    AND selection_status = 'selected'
  LIMIT 1;

  IF v_registration_id IS NOT NULL THEN
    RAISE NOTICE 'Found registration_id: %', v_registration_id;
  ELSE
    RAISE NOTICE 'No registration found for user_id: %', v_user_id;
  END IF;
END $$;

-- 4. Check the actual INSERT policy condition more carefully
SELECT
  'Policy Details' as check_type,
  policyname,
  pg_get_expr(qual, policy::regclass::oid) as using_expression,
  pg_get_expr(with_check, policy::regclass::oid) as check_expression
FROM pg_policies
WHERE tablename = 'daftar_ulang_submissions';

-- 5. Check if there's a policy that allows inserts based on registration ownership
-- This is the key question: Can a user insert if they own the related registration?
SELECT
  'Registration Ownership Check' as check_type,
  p.id as registration_id,
  p.user_id as registration_user_id,
  p.selection_status,
  p.batch_id
FROM pendaftaran_tikrar_tahfidz p
WHERE p.selection_status = 'selected'
LIMIT 5;
