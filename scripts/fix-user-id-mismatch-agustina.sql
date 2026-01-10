-- Fix user_id mismatch for Agustina Eliyanti
-- This script updates the user_id in pendaftaran_tikrar_tahfidz to match the auth user

-- First, let's find the registration for Agustina
SELECT
  pt.id,
  pt.user_id as current_user_id,
  pt.full_name,
  pt.status,
  pt.selection_status,
  u.email as auth_email
FROM pendaftaran_tikrar_tahfidz pt
LEFT JOIN auth.users u ON u.id = pt.user_id
WHERE pt.full_name ILIKE '%Agustina%' AND pt.full_name ILIKE '%eliyanti%';

-- Now update to the correct user_id (5e1b7339-1584-4144-a299-1d8788714fef)
-- ONLY RUN THIS AFTER VERIFYING THE ABOVE QUERY

-- UPDATE pendaftaran_tikrar_tahfidz
-- SET user_id = '5e1b7339-1584-4144-a299-1d8788714fef'
-- WHERE full_name ILIKE '%Agustina%' AND full_name ILIKE '%eliyanti%';

-- Verify the update
SELECT
  pt.id,
  pt.user_id as updated_user_id,
  pt.full_name,
  pt.status,
  u.email as auth_email
FROM pendaftaran_tikrar_tahfidz pt
LEFT JOIN auth.users u ON u.id = pt.user_id
WHERE pt.user_id = '5e1b7339-1584-4144-a299-1d8788714fef';
