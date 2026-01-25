-- ============================================================================
-- Check dewifebriani@gmail.com registration details
-- ============================================================================

-- 1. Get the registration with all details
SELECT
  pt.id,
  pt.user_id,
  pt.full_name,
  pt.email,
  pt.status as reg_status,
  pt.selection_status,
  pt.batch_id,
  pt.program_id,
  pt.created_at,
  b.id as batch_check,
  b.name as batch_name,
  b.status as batch_status,
  b.registration_start_date,
  b.selection_start_date,
  b.re_enrollment_date,
  b.opening_class_date,
  p.name as program_name
FROM pendaftaran_tikrar_tahfidz pt
LEFT JOIN batches b ON b.id = pt.batch_id
LEFT JOIN programs p ON p.id = pt.program_id
WHERE pt.user_id = 'eccdf0f7-e9e7-4284-bf8f-5b5816dcf682';

-- 2. Check auth user
SELECT
  id,
  email,
  created_at
FROM auth.users
WHERE id = 'eccdf0f7-e9e7-4284-bf8f-5b5816dcf682';

-- 3. Check users profile
SELECT
  id,
  full_name,
  email,
  role
FROM users
WHERE id = 'eccdf0f7-e9e7-4284-bf8f-5b5816dcf682';

-- 4. Check if this registration passes the filter (batch.status = 'open')
SELECT
  pt.id,
  pt.full_name,
  pt.status as reg_status,
  b.name as batch_name,
  b.status as batch_status,
  CASE WHEN b.status = 'open' THEN 'PASS' ELSE 'FILTERED OUT' END as filter_result
FROM pendaftaran_tikrar_tahfidz pt
LEFT JOIN batches b ON b.id = pt.batch_id
WHERE pt.user_id = 'eccdf0f7-e9e7-4284-bf8f-5b5816dcf682';

-- 5. Check all batches and their status
SELECT
  id,
  name,
  status,
  registration_start_date,
  selection_start_date,
  re_enrollment_date,
  opening_class_date
FROM batches
ORDER BY created_at DESC;
