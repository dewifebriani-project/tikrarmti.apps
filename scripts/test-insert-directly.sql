-- ============================================================================
-- Test INSERT directly to see the exact error
-- ============================================================================

-- First, get the user and registration info
DO $$
DECLARE
  v_user_id uuid;
  v_registration_id uuid;
  v_batch_id uuid;
  v_auth_uid uuid;
BEGIN
  -- Get user info
  SELECT id INTO v_user_id FROM users WHERE email = 'dewifebriani@tazkia.ac.id';
  SELECT id INTO v_registration_id FROM pendaftaran_tikrar_tahfidz WHERE user_id = v_user_id AND selection_status = 'selected' LIMIT 1;
  SELECT batch_id INTO v_batch_id FROM pendaftaran_tikrar_tahfidz WHERE id = v_registration_id;

  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Registration ID: %', v_registration_id;
  RAISE NOTICE 'Batch ID: %', v_batch_id;

  -- Get auth.uid() - this simulates what the RLS policy sees
  v_auth_uid := auth.uid();
  RAISE NOTICE 'auth.uid() returns: %', v_auth_uid;
  RAISE NOTICE 'Does user_id match auth.uid()? %', CASE WHEN v_user_id = v_auth_uid THEN 'YES' ELSE 'NO - THIS IS THE PROBLEM!' END;

  -- Try to INSERT
  RAISE NOTICE '';
  RAISE NOTICE 'Attempting INSERT...';

  INSERT INTO daftar_ulang_submissions (
    user_id,
    registration_id,
    batch_id,
    confirmed_full_name,
    confirmed_chosen_juz,
    confirmed_main_time_slot,
    confirmed_backup_time_slot,
    partner_type,
    status
  ) VALUES (
    v_user_id,
    v_registration_id,
    v_batch_id,
    'Test Name',
    '29A',
    '06-09',
    '09-12',
    'self_match',
    'draft'
  );

  RAISE NOTICE 'INSERT SUCCESSFUL!';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '';
  RAISE NOTICE '=== INSERT FAILED ===';
  RAISE NOTICE 'Error: %', SQLERRM;
  RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
  RAISE NOTICE '';

  -- Clean up test data if any
  IF SQLSTATE = '42501' THEN -- RLS violation
    RAISE NOTICE 'This is a Row Level Security violation.';
    RAISE NOTICE 'The RLS policy is blocking the INSERT.';
  END IF;
END $$;

-- Check what auth.uid() actually returns
SELECT
  '=== CHECK auth.uid() ===' as section,
  auth.uid() as current_auth_uid,
  (SELECT id FROM users WHERE email = 'dewifebriani@tazkia.ac.id') as user_id_from_table,
  CASE
    WHEN auth.uid() = (SELECT id FROM users WHERE email = 'dewifebriani@tazkia.ac.id') THEN 'MATCH - RLS should allow INSERT'
    ELSE 'MISMATCH - RLS will BLOCK INSERT because user_id != auth.uid()'
  END as rls_will;

-- Check if the user IDs match between auth.users and public.users
SELECT
  '=== USER ID COMPARISON ===' as section,
  au.id as auth_users_id,
  pu.id as public_users_id,
  au.email,
  CASE
    WHEN au.id = pu.id THEN 'IDs MATCH - OK'
    ELSE 'IDs DO NOT MATCH - THIS IS THE PROBLEM!'
  END as id_match_status
FROM auth.users au
LEFT JOIN public.users pu ON pu.email = au.email
WHERE au.email = 'dewifebriani@tazkia.ac.id';
