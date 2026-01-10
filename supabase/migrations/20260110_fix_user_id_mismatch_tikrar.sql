-- ============================================================================
-- Migration: Fix user_id mismatch in pendaftaran_tikrar_tahfidz
-- Date: 2026-01-10
-- Description: Update user_id to match auth.users based on email
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

-- ============================================================================
-- THE FIX: Update user_id based on email match (wa_phone contains email)
-- ============================================================================

-- Before running, verify the fix will work correctly:
SELECT
  pt.id as registration_id,
  pt.user_id as current_user_id,
  pt.wa_phone as email_in_wa_phone,
  au.id as correct_user_id,
  au.email as auth_email
FROM pendaftaran_tikrar_tahfidz pt
INNER JOIN auth.users au ON LOWER(au.email) = LOWER(pt.wa_phone)
WHERE pt.user_id != au.id
LIMIT 20;

-- Run the fix - update user_id to match the auth user with same email
UPDATE pendaftaran_tikrar_tahfidz pt
SET user_id = (
  SELECT au.id
  FROM auth.users au
  WHERE LOWER(au.email) = LOWER(pt.wa_phone)
  LIMIT 1
)
WHERE pt.wa_phone IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM auth.users au
    WHERE LOWER(au.email) = LOWER(pt.wa_phone)
      AND pt.user_id != au.id
  );

-- Verify the fix
SELECT
  pt.id as registration_id,
  pt.user_id as updated_user_id,
  pt.full_name,
  pt.wa_phone,
  au.email as auth_email,
  pt.status
FROM pendaftaran_tikrar_tahfidz pt
INNER JOIN auth.users au ON au.id = pt.user_id
ORDER BY pt.created_at DESC
LIMIT 20;

-- Count how many were fixed
SELECT
  COUNT(*) as total_registrations,
  COUNT(DISTINCT pt.user_id) as unique_users
FROM pendaftaran_tikrar_tahfidz pt
INNER JOIN auth.users au ON au.id = pt.user_id;
