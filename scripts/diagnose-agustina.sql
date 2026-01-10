-- ============================================================================
-- Comprehensive diagnostic for Agustina's registration issue
-- ============================================================================

-- 1. Check auth user details
SELECT
  'AUTH USER' as source,
  id,
  email,
  created_at
FROM auth.users
WHERE email ILIKE '%agustina%';

-- 2. Check users table
SELECT
  'USERS TABLE' as source,
  id,
  full_name,
  email,
  role
FROM users
WHERE email ILIKE '%agustina%'
   OR full_name ILIKE '%agustina%';

-- 3. Check ALL registrations table (all columns)
SELECT
  'REGISTRATIONS TABLE' as source,
  id,
  user_id,
  full_name,
  email,
  wa_phone,
  status,
  selection_status,
  batch_id,
  created_at
FROM pendaftaran_tikrar_tahfidz
WHERE full_name ILIKE '%agustina%'
   OR email ILIKE '%agustina%'
   OR user_id = '5e1b7339-1584-4144-a299-1d8788714fef';

-- 4. Check if user_id exists in auth
SELECT
  'USER_ID CHECK' as source,
  pt.id as reg_id,
  pt.user_id as reg_user_id,
  CASE WHEN au.id IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as user_exists_in_auth,
  au.email as auth_email,
  pt.email as reg_email,
  pt.full_name as reg_full_name
FROM pendaftaran_tikrar_tahfidz pt
LEFT JOIN auth.users au ON au.id = pt.user_id
WHERE pt.full_name ILIKE '%agustina%'
   OR pt.email ILIKE '%agustina%';

-- 5. Sample of recent registrations to see the data pattern
SELECT
  'RECENT REGISTRATIONS SAMPLE' as source,
  id,
  user_id,
  full_name,
  email,
  LEFT(wa_phone, 20) as wa_phone_preview,
  status,
  created_at
FROM pendaftaran_tikrar_tahfidz
ORDER BY created_at DESC
LIMIT 10;

-- 6. Count total registrations with email field
SELECT
  'EMAIL FIELD STATS' as source,
  COUNT(*) as total_registrations,
  COUNT(email) as with_email,
  COUNT(*) - COUNT(email) as without_email
FROM pendaftaran_tikrar_tahfidz;

-- 7. Check for any Agustina in full_name with different email spelling
SELECT
  'FULL_NAME SEARCH' as source,
  id,
  user_id,
  full_name,
  email,
  wa_phone,
  status
FROM pendaftaran_tikrar_tahfidz
WHERE full_name ILIKE '%Agustina%'
ORDER BY created_at DESC;
