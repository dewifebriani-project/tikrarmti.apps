-- ============================================================================
-- Debug: Check if dual-role user has pendaftaran_tikrar_tahfidz data
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
WHERE email = 'vivinurvina@gmail.com';

-- 2. Check pendaftaran_tikrar_tahfidz by email
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
WHERE email = 'vivinurvina@gmail.com';

-- 3. Check batch status
SELECT
  '=== BATCH STATUS ===' as section,
  id,
  name,
  status
FROM batches
WHERE id IN (
  SELECT batch_id
  FROM pendaftaran_tikrar_tahfidz
  WHERE email = 'vivinurvina@gmail.com'
);

-- 4. Check if user is in halaqah_students (as thalibah)
SELECT
  '=== HALAQAH STUDENTS (THALIBAH) ===' as section,
  hs.id,
  hs.thalibah_id,
  hs.halaqah_id,
  hs.status,
  h.name as halaqah_name
FROM halaqah_students hs
JOIN halaqah h ON hs.halaqah_id = h.id
WHERE hs.thalibah_id = (SELECT id FROM users WHERE email = 'vivinurvina@gmail.com');

-- 5. Check if user is in halaqah_mentors (as muallimah)
SELECT
  '=== HALAQAH MENTORS (MUALLIMAH) ===' as section,
  hm.id,
  hm.mentor_id,
  hm.halaqah_id,
  h.name as halaqah_name
FROM halaqah_mentors hm
JOIN halaqah h ON hm.halaqah_id = h.id
WHERE hm.mentor_id = (SELECT id FROM users WHERE email = 'vivinurvina@gmail.com');
