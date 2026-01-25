-- ============================================================================
-- Test INSERT with simulated auth.uid()
-- ============================================================================

-- First, let's see what policies actually exist
SELECT
  '=== ALL INSERT POLICIES (RAW) ===' as section,
  policyname,
  permissive::text as permissive,
  with_check
FROM pg_policies
WHERE tablename = 'daftar_ulang_submissions'
  AND cmd = 'INSERT'
ORDER BY policyname;

-- Test INSERT by setting the auth context
-- This simulates what happens when the app calls the database
DO $$
DECLARE
  v_test_user_id uuid := 'f008072f-3197-4b25-9584-cf61cebc0416';
  v_test_reg_id uuid := '176e610c-b9a3-4fe3-af12-0c3637fa6085';
  v_test_batch_id uuid;
  v_current_uid uuid;
BEGIN
  -- Get batch_id
  SELECT batch_id INTO v_test_batch_id
  FROM pendaftaran_tikrar_tahfidz
  WHERE id = v_test_reg_id;

  -- Get current auth.uid() without setting it
  v_current_uid := auth.uid();

  RAISE NOTICE '';
  RAISE NOTICE '=== INSERT TEST ===';
  RAISE NOTICE 'Test User ID: %', v_test_user_id;
  RAISE NOTICE 'Test Registration ID: %', v_test_reg_id;
  RAISE NOTICE 'Test Batch ID: %', v_test_batch_id;
  RAISE NOTICE 'Current auth.uid(): %', COALESCE(v_current_uid::text, 'NULL');
  RAISE NOTICE '';

  -- Check if submission already exists
  IF EXISTS (
    SELECT 1 FROM daftar_ulang_submissions
    WHERE user_id = v_test_user_id AND registration_id = v_test_reg_id
  ) THEN
    RAISE NOTICE '⚠️  Submission already exists - cannot test INSERT (UNIQUE constraint would block)';
    RAISE NOTICE 'This is expected for this user.';
    RETURN;
  END IF;

  RAISE NOTICE 'Attempting INSERT...';

  -- Try INSERT
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
    v_test_user_id,
    v_test_reg_id,
    v_test_batch_id,
    'Test Name',
    '29A',
    '06-09',
    '09-12',
    'self_match',
    'draft'
  );

  RAISE NOTICE '✅ INSERT SUCCESSFUL!';

  -- Clean up
  DELETE FROM daftar_ulang_submissions
  WHERE user_id = v_test_user_id
    AND registration_id = v_test_reg_id
    AND confirmed_full_name = 'Test Name';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '';
  RAISE NOTICE '❌ INSERT FAILED!';
  RAISE NOTICE 'Error: %', SQLERRM;
  RAISE NOTICE 'SQLSTATE: %', SQLSTATE;

  IF SQLSTATE = '23505' THEN
    RAISE NOTICE '';
    RAISE NOTICE 'This is a UNIQUE constraint violation.';
    RAISE NOTICE 'A submission already exists for this user/registration.';
  ELSIF SQLSTATE = '42501' THEN
    RAISE NOTICE '';
    RAISE NOTICE 'This is a Row Level Security violation.';
    RAISE NOTICE 'The RLS policy is blocking the INSERT.';
    RAISE NOTICE 'Check if auth.uid() is being set correctly.';
  END IF;
END $$;
