-- ============================================================================
-- Detailed check for agustinaeliyanti459@gmail.com
-- ============================================================================

-- 1. Check auth user
SELECT
  'AUTH USER' as source,
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'agustinaeliyanti459@gmail.com';

-- 2. Check users table
SELECT
  'USERS TABLE' as source,
  id,
  full_name,
  email,
  phone_number
FROM users
WHERE id = '5e1b7339-1584-4144-a299-1d8788714fef';

-- 3. Find ALL registrations that might belong to this user
-- Try by email field (case insensitive)
SELECT
  'BY EMAIL FIELD (ILIKE)' as source,
  id,
  user_id,
  full_name,
  email,
  wa_phone,
  status,
  batch_id,
  created_at
FROM pendaftaran_tikrar_tahfidz
WHERE LOWER(email) LIKE LOWER('%agustinaeliyanti459@gmail.com%')
ORDER BY created_at DESC;

-- 4. Try by exact email match
SELECT
  'BY EMAIL FIELD (EXACT)' as source,
  id,
  user_id,
  full_name,
  email,
  wa_phone,
  status,
  batch_id,
  created_at
FROM pendaftaran_tikrar_tahfidz
WHERE LOWER(email) = 'agustinaeliyanti459@gmail.com'
ORDER BY created_at DESC;

-- 5. Try by full_name containing "agustina" or "eliyanti"
SELECT
  'BY FULL_NAME (ILIKE agustina)' as source,
  id,
  user_id,
  full_name,
  email,
  wa_phone,
  status,
  batch_id,
  created_at
FROM pendaftaran_tikrar_tahfidz
WHERE LOWER(full_name) LIKE '%agustina%'
   OR LOWER(full_name) LIKE '%eliyanti%'
ORDER BY created_at DESC;

-- 6. Try by wa_phone containing email (in case email was put in wrong field)
SELECT
  'BY WA_PHONE (email in wrong field?)' as source,
  id,
  user_id,
  full_name,
  email,
  wa_phone,
  status,
  batch_id
FROM pendaftaran_tikrar_tahfidz
WHERE wa_phone ILIKE '%agustina%'
ORDER BY created_at DESC;

-- 7. Check if there's a registration with this exact user_id
SELECT
  'BY USER_ID' as source,
  id,
  user_id,
  full_name,
  email,
  wa_phone,
  status,
  batch_id,
  created_at
FROM pendaftaran_tikrar_tahfidz
WHERE user_id = '5e1b7339-1584-4144-a299-1d8788714fef'
ORDER BY created_at DESC;

-- 8. Show sample of recent registrations to understand the data pattern
SELECT
  'RECENT REGISTRATIONS SAMPLE' as source,
  id,
  user_id,
  full_name,
  email,
  wa_phone,
  status,
  created_at
FROM pendaftaran_tikrar_tahfidz
ORDER BY created_at DESC
LIMIT 10;
