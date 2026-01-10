-- ============================================================================
-- Test Halaqah Data - Diagnostic Queries
-- ============================================================================

-- 1. Check total halaqah
SELECT COUNT(*) as total_halaqah FROM halaqah;

-- 2. Check active halaqah
SELECT COUNT(*) as active_halaqah FROM halaqah WHERE status = 'active';

-- 3. Show sample halaqah data
SELECT
  id,
  name,
  muallimah_id,
  day_of_week,
  start_time,
  end_time,
  status,
  max_students,
  preferred_juz
FROM halaqah
WHERE status = 'active'
ORDER BY day_of_week
LIMIT 10;

-- 4. Check muallimah info for halaqah
SELECT
  h.id as halaqah_id,
  h.name as halaqah_name,
  h.muallimah_id,
  u.full_name as muallimah_name,
  u.email as muallimah_email
FROM halaqah h
LEFT JOIN users u ON u.id = h.muallimah_id
WHERE h.status = 'active'
LIMIT 10;

-- 5. Check muallimah registrations with preferred_juz
SELECT
  user_id,
  preferred_juz,
  class_type,
  status,
  batch_id
FROM muallimah_registrations
WHERE status = 'approved'
LIMIT 10;
