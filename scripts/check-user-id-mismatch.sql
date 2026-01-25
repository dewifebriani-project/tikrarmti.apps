-- Check user_id mismatch between users and pendaftaran_tikrar_tahfidz
-- For user: agustinaeliyanti459@gmail.com

-- 1. Find the user in users table
SELECT id, email, full_name
FROM users
WHERE email = 'agustinaeliyanti459@gmail.com';

-- 2. Find all registrations for this email/user
SELECT
  pt.id,
  pt.user_id,
  pt.full_name,
  pt.status,
  pt.selection_status,
  u.email as user_email_from_auth,
  u2.email as user_email_from_users_table
FROM pendaftaran_tikrar_tahfidz pt
LEFT JOIN auth.users u ON u.id = pt.user_id
LEFT JOIN users u2 ON u2.id = pt.user_id
WHERE pt.full_name ILIKE '%Agustina%' OR pt.full_name ILIKE '%eliyanti%'
ORDER BY pt.created_at DESC;

-- 3. Check if the auth user ID exists in pendaftaran_tikrar_tahfidz
SELECT
  pt.id,
  pt.user_id,
  pt.full_name,
  pt.status,
  pt.selection_status
FROM pendaftaran_tikrar_tahfidz pt
WHERE pt.user_id = '5e1b7339-1584-4144-a299-1d8788714fef';

-- 4. Find the actual user_id for Agustina in pendaftaran_tikrar_tahfidz
SELECT
  pt.user_id,
  pt.full_name,
  pt.status,
  COUNT(*) as registration_count
FROM pendaftaran_tikrar_tahfidz pt
WHERE pt.full_name ILIKE '%Agustina%'
GROUP BY pt.user_id, pt.full_name, pt.status;
