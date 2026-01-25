-- ============================================================================
-- Debug: Check if dual-role user has pendaftaran_tikrar_tahfidz data
-- ============================================================================
-- Replace with actual user email you want to check
-- ============================================================================

-- 1. Check user details
SELECT
  '=== USER DETAILS ===' as section,
  id,
  email,
  full_name,
  role,
  roles
FROM users
WHERE email = 'vivinurvina@gmail.com';  -- Replace with actual email

-- 2. Check if user is in halaqah_students (as thalibah)
SELECT
  '=== HALAQAH STUDENTS (THALIBAH) ===' as section,
  hs.id,
  hs.thalibah_id,
  hs.halaqah_id,
  hs.status,
  h.name as halaqah_name
FROM halaqah_students hs
JOIN halaqah h ON hs.halaqah_id = h.id
WHERE hs.thalibah_id = (SELECT id FROM users WHERE email = 'vivin.nurvina@tazkia.ac.id');

-- 3. Check if user is in halaqah_mentors (as muallimah)
SELECT
  '=== HALAQAH MENTORS (MUALLIMAH) ===' as section,
  hm.id,
  hm.mentor_id,
  hm.halaqah_id,
  h.name as halaqah_name
FROM halaqah_mentors hm
JOIN halaqah h ON hm.halaqah_id = h.id
WHERE hm.mentor_id = (SELECT id FROM users WHERE email = 'vivin.nurvina@tazkia.ac.id');

-- 4. Check pendaftaran_tikrar_tahfidz by user_id
SELECT
  '=== PENDAFTARAN BY USER_ID ===' as section,
  id,
  user_id,
  email,
  full_name,
  status,
  selection_status,
  batch_id,
  created_at
FROM pendaftaran_tikrar_tahfidz
WHERE user_id = (SELECT id FROM users WHERE email = 'vivin.nurvina@tazkia.ac.id');

-- 5. Check pendaftaran_tikrar_tahfidz by email (in case user_id mismatch)
SELECT
  '=== PENDAFTARAN BY EMAIL ===' as section,
  id,
  user_id,
  email,
  full_name,
  status,
  selection_status,
  batch_id,
  created_at
FROM pendaftaran_tikrar_tahfidz
WHERE email = 'vivin.nurvina@tazkia.ac.id';

-- 6. Check batch status
SELECT
  '=== BATCH STATUS ===' as section,
  id,
  name,
  status
FROM batches
WHERE id IN (
  SELECT batch_id
  FROM pendaftaran_tikrar_tahfidz
  WHERE email = 'vivin.nurvina@tazkia.ac.id'
);

-- 7. Test RLS - What can this user see?
DO $$
DECLARE
  v_user_id uuid;
  v_record_count integer;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE email = 'vivin.nurvina@tazkia.ac.id';

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User not found';
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_record_count
  FROM pendaftaran_tikrar_tahfidz
  WHERE user_id = v_user_id;

  RAISE NOTICE 'User % can see % records via RLS', v_user_id, v_record_count;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error: %', SQLERRM;
END $$;
