-- ============================================================================
-- Analyze registration data to understand how to match users
-- ============================================================================

-- 1. Sample registration data to see the pattern
SELECT
  id,
  user_id,
  full_name,
  email,
  wa_phone,
  status,
  created_at
FROM pendaftaran_tikrar_tahfidz
ORDER BY created_at DESC
LIMIT 20;

-- 2. Check users table to see what we have
SELECT
  id,
  full_name,
  email,
  phone_number,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 20;

-- 3. Try matching by full_name between users and registrations
SELECT
  'POTENTIAL MATCHES BY NAME' as source,
  u.id as user_id,
  u.email as user_email,
  u.full_name as user_full_name,
  pt.id as reg_id,
  pt.user_id as reg_user_id,
  pt.full_name as reg_full_name,
  pt.email as reg_email,
  pt.status as reg_status
FROM users u
INNER JOIN pendaftaran_tikrar_tahfidz pt ON LOWER(u.full_name) = LOWER(pt.full_name)
WHERE u.id != pt.user_id
LIMIT 20;

-- 4. Count how many could be matched by full_name
SELECT
  COUNT(*) as potential_matches_by_name
FROM users u
INNER JOIN pendaftaran_tikrar_tahfidz pt ON LOWER(u.full_name) = LOWER(pt.full_name)
WHERE u.id != pt.user_id;

-- 5. Check if wa_phone contains email pattern for some registrations
SELECT
  COUNT(*) as count,
  CASE
    WHEN wa_phone LIKE '%@%' THEN 'CONTAINS @'
    ELSE 'NO @'
  END as category
FROM pendaftaran_tikrar_tahfidz
GROUP BY
  CASE
    WHEN wa_phone LIKE '%@%' THEN 'CONTAINS @'
    ELSE 'NO @'
  END;

-- 6. Sample of registrations where wa_phone might contain email
SELECT
  id,
  user_id,
  full_name,
  wa_phone,
  email
FROM pendaftaran_tikrar_tahfidz
WHERE wa_phone LIKE '%@%'
LIMIT 20;

-- 7. Show all auth users with their profile
SELECT
  au.id as auth_id,
  au.email as auth_email,
  u.full_name as profile_name,
  u.email as profile_email,
  u.phone_number as profile_phone
FROM auth.users au
LEFT JOIN users u ON u.id = au.id
ORDER BY au.created_at DESC
LIMIT 20;
