-- ============================================================================
-- Verify submission exists WITHOUT using auth.uid()
-- ============================================================================

-- Check if submission exists using direct user_id
SELECT
  '=== SUBMISSION EXISTS CHECK ===' as section,
  id,
  user_id,
  registration_id,
  status,
  created_at
FROM daftar_ulang_submissions
WHERE user_id = 'f008072f-3197-4b25-9584-cf61cebc0416'
  AND registration_id = '176e610c-b9a3-4fe3-af12-0c3637fa6085';

-- If this returns data, the submission EXISTS.
-- The problem is that when the app runs the query with auth.uid(),
-- it returns NULL because auth.uid() is not set in the direct SQL context.

-- Conclusion:
-- The app code should be able to SELECT the existing submission
-- when running from the web app (where auth.uid() is properly set).
-- The issue might be:
-- 1. auth.uid() returns NULL in the app context
-- 2. Or there's a timing issue where the session is not properly passed

-- Let's verify the IDs match
SELECT
  '=== USER ID VERIFICATION ===' as section,
  (SELECT id FROM users WHERE email = 'dewifebriani@tazkia.ac.id') as user_id_from_users_table,
  (SELECT id FROM auth.users WHERE email = 'dewifebriani@tazkia.ac.id') as user_id_from_auth_table,
  CASE
    WHEN (SELECT id FROM users) = (SELECT id FROM auth.users WHERE email = 'dewifebriani@tazkia.ac.id')
    THEN 'IDs MATCH - OK'
    ELSE 'IDs DO NOT MATCH - THIS IS THE PROBLEM!'
  END as verification;
