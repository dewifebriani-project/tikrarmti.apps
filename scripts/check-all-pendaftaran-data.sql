-- ============================================================================
-- Debug: Check all pendaftaran_tikrar_tahfidz data to find user
-- ============================================================================

-- Search by name pattern
SELECT
  '=== SEARCH BY NAME (Vivin) ===' as section,
  id,
  user_id,
  email,
  full_name,
  status,
  selection_status,
  batch_id,
  created_at
FROM pendaftaran_tikrar_tahfidz
WHERE full_name ILIKE '%vivin%'
   OR email ILIKE '%vivin%'
ORDER BY created_at DESC;

-- Check all recent registrations (last 50)
SELECT
  '=== ALL RECENT REGISTRATIONS ===' as section,
  id,
  user_id,
  email,
  full_name,
  status,
  selection_status,
  batch_id,
  created_at
FROM pendaftaran_tikrar_tahfidz
ORDER BY created_at DESC
LIMIT 50;

-- Check batch statuses
SELECT
  '=== ALL BATCH STATUSES ===' as section,
  id,
  name,
  status,
  start_date = registration_start_date,
  end_date = registration_end_date
FROM batches
ORDER BY created_at DESC;

-- Check if there's a batch with status 'open'
SELECT
  '=== OPEN BATCHES ===' as section,
  id,
  name,
  status,
  registration_start_date,
  registration_end_date
FROM batches
WHERE status = 'open';
