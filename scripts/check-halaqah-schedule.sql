-- Check halaqah table for schedule data
SELECT 
  id,
  name,
  day_of_week,
  start_time,
  end_time,
  location,
  status,
  preferred_juz,
  muallimah_id
FROM halaqah
WHERE status = 'active'
ORDER BY day_of_week;

-- Check muallimah_registrations for schedule data
SELECT 
  user_id,
  batch_id,
  class_type,
  preferred_juz,
  preferred_schedule
FROM muallimah_registrations
WHERE status = 'approved'
LIMIT 10;
