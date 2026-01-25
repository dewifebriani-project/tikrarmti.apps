-- ============================================================================
-- Test UPDATE from draft to submitted
-- ============================================================================

DO $$
DECLARE
  v_submission_id uuid := 'e233b9b7-3285-4354-b71f-ba9a7344d646';
  v_old_status varchar;
  v_new_status varchar;
BEGIN
  -- Get current status
  SELECT status INTO v_old_status
  FROM daftar_ulang_submissions
  WHERE id = v_submission_id;

  RAISE NOTICE 'Current status: %', v_old_status;
  RAISE NOTICE 'Testing UPDATE draft -> submitted...';

  -- Try UPDATE
  UPDATE daftar_ulang_submissions
  SET status = 'submitted',
      submitted_at = NOW(),
      updated_at = NOW()
  WHERE id = v_submission_id;

  -- Verify the update
  SELECT status INTO v_new_status
  FROM daftar_ulang_submissions
  WHERE id = v_submission_id;

  RAISE NOTICE 'New status: %', v_new_status;

  IF v_new_status = 'submitted' THEN
    RAISE NOTICE '✅ UPDATE SUCCESSFUL! Policy fix worked! User can now submit daftar ulang.';

    -- Revert for now (so user can actually submit later)
    UPDATE daftar_ulang_submissions
    SET status = 'draft',
        submitted_at = NULL,
        updated_at = NOW()
    WHERE id = v_submission_id;

    RAISE NOTICE '✅ Changes reverted (for testing). User can now submit for real!';
  ELSE
    RAISE NOTICE '❌ UPDATE did not work as expected.';
  END IF;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '';
  RAISE NOTICE '❌ UPDATE FAILED!';
  RAISE NOTICE 'Error: %', SQLERRM;
  RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
END $$;
