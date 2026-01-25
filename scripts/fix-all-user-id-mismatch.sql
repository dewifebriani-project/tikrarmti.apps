-- ============================================================================
-- Fix ALL user_id mismatches between pendaftaran_tikrar_tahfidz and auth.users
-- This matches registrations by email and updates the user_id
-- ============================================================================

-- First, let's see the problem - registrations with user_id that doesn't exist in auth
SELECT
  pt.id as registration_id,
  pt.user_id as stored_user_id,
  pt.full_name,
  pt.wa_phone,
  pt.status,
  au.id as auth_user_id,
  au.email as auth_email
FROM pendaftaran_tikrar_tahfidz pt
LEFT JOIN auth.users au ON au.id = pt.user_id
WHERE au.id IS NULL
LIMIT 20;

-- Also check: registrations where email exists in wa_phone field but user_id is wrong
SELECT
  pt.id as registration_id,
  pt.user_id as stored_user_id,
  pt.wa_phone,
  pt.full_name,
  au.email as auth_email_for_this_id,
  au2.id as correct_user_id,
  au2.email as correct_email
FROM pendaftaran_tikrar_tahfidz pt
LEFT JOIN auth.users au ON au.id = pt.user_id
LEFT JOIN auth.users au2 ON LOWER(au2.email) = LOWER(pt.wa_phone)
WHERE pt.wa_phone IS NOT NULL
  AND au2.id IS NOT NULL
  AND pt.user_id != au2.id
LIMIT 20;

-- ============================================================================
-- THE FIX: Update user_id based on email match in wa_phone field
-- ============================================================================

-- UPDATE pendaftaran_tikrar_tahfidz pt
-- SET user_id = (
--   SELECT au2.id
--   FROM auth.users au2
--   WHERE LOWER(au2.email) = LOWER(pt.wa_phone)
--   LIMIT 1
-- )
-- WHERE pt.wa_phone IS NOT NULL
--   AND EXISTS (
--     SELECT 1
--     FROM auth.users au2
--     WHERE LOWER(au2.email) = LOWER(pt.wa_phone)
--   );

-- Verify the fix
SELECT
  pt.id as registration_id,
  pt.user_id as stored_user_id,
  pt.wa_phone,
  pt.full_name,
  au.email as auth_email
FROM pendaftaran_tikrar_tahfidz pt
LEFT JOIN auth.users au ON au.id = pt.user_id
WHERE pt.wa_phone IS NOT NULL
LIMIT 20;
