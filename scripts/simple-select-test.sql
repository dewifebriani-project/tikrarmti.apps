-- ============================================================================
-- Simple SELECT test - Can user see their own submissions?
-- ============================================================================

-- Test: Can we SELECT from daftar_ulang_submissions for this user?
-- This simulates what the app does in actions.ts line 215-220

DO $$
DECLARE
  v_user_id uuid := 'f008072f-3197-4b25-9584-cf61cebc0416'::uuid;
  v_registration_id uuid := '176e610c-b9a3-4fe3-af12-0c3637fa6085'::uuid;
  v_existing_id uuid;
  v_existing_status varchar;
BEGIN
  RAISE NOTICE 'Testing SELECT query...';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Registration ID: %', v_registration_id;
  RAISE NOTICE 'auth.uid(): %', auth.uid();
  RAISE NOTICE '';

  -- This is the EXACT query from actions.ts
  SELECT id, status INTO v_existing_id, v_existing_status
  FROM daftar_ulang_submissions
  WHERE user_id = v_user_id
    AND registration_id = v_registration_id
  LIMIT 1;

  RAISE NOTICE '✅ SELECT SUCCESSFUL!';
  RAISE NOTICE 'Found submission ID: %', v_existing_id;
  RAISE NOTICE 'Status: %', v_existing_status;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '';
  RAISE NOTICE '❌ SELECT FAILED!';
  RAISE NOTICE 'Error: %', SQLERRM;
  RAISE NOTICE 'SQLSTATE: %', SQLSTATE;

  IF SQLSTATE = '42501' THEN
    RAISE NOTICE '';
    RAISE NOTICE '🔴 THIS IS THE ROOT CAUSE!';
    RAISE NOTICE 'User cannot SELECT their own submissions.';
    RAISE NOTICE 'The app thinks no draft exists and tries to INSERT.';
    RAISE NOTICE 'Then UNIQUE constraint blocks the INSERT.';
  END IF;
END $$;
