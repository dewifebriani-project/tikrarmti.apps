-- Find Agustina Eliyanti's registration and user_id
-- Current auth user ID: 5e1b7339-1584-4144-a299-1d8788714fef

-- 1. Find registration by name
SELECT
  pt.id,
  pt.user_id as stored_user_id,
  pt.full_name,
  pt.status,
  pt.selection_status,
  pt.wa_phone,
  pt.created_at
FROM pendaftaran_tikrar_tahfidz pt
WHERE pt.full_name ILIKE '%Agustina%' OR pt.full_name ILIKE '%eliyanti%'
ORDER BY pt.created_at DESC;

-- 2. Check if the stored user_id exists in auth.users
SELECT
  u.id,
  u.email,
  u.created_at
FROM auth.users u
WHERE u.id IN (
  SELECT pt.user_id
  FROM pendaftaran_tikrar_tahfidz pt
  WHERE pt.full_name ILIKE '%Agustina%' OR pt.full_name ILIKE '%eliyanti%'
);

-- 3. Check all users with similar email
SELECT
  u.id,
  u.email,
  u.created_at
FROM auth.users u
WHERE u.email ILIKE '%agustina%' OR u.email ILIKE '%eliyanti%';

-- 4. Direct check for the current auth user
SELECT
  u.id,
  u.email,
  u.raw_user_meta_data
FROM auth.users u
WHERE u.id = '5e1b7339-1584-4144-a299-1d8788714fef';
