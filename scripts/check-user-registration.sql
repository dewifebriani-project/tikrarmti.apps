-- Direct check for agustinaeliyanti459@gmail.com registration
-- Check if registration exists with correct user_id
SELECT
  pt.id,
  pt.user_id,
  pt.full_name,
  pt.email,
  pt.wa_phone,
  pt.status,
  pt.selection_status,
  pt.batch_id,
  pt.created_at,
  b.id as batch_id_check,
  b.name as batch_name,
  b.status as batch_status
FROM pendaftaran_tikrar_tahfidz pt
LEFT JOIN batches b ON b.id = pt.batch_id
WHERE pt.email ILIKE '%agustina%'
   OR pt.user_id = '5e1b7339-1584-4144-a299-1d8788714fef'
ORDER BY pt.created_at DESC;

-- Check auth user exists
SELECT
  id,
  email,
  created_at
FROM auth.users
WHERE email ILIKE '%agustina%';

-- Count all registrations for this email pattern
SELECT COUNT(*) as count
FROM pendaftaran_tikrar_tahfidz
WHERE email ILIKE '%agustina%';
