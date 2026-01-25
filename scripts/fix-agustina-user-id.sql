-- ============================================================================
-- Manual fix for agustinaeliyanti459@gmail.com user_id mismatch
-- ============================================================================

-- Step 1: Find the registration (try multiple approaches)
-- Approach A: By email field
SELECT
  'APPROACH A: By email field' as method,
  id,
  user_id,
  full_name,
  email,
  status
FROM pendaftaran_tikrar_tahfidz
WHERE LOWER(email) = 'agustinaeliyanti459@gmail.com';

-- Approach B: By full_name
SELECT
  'APPROACH B: By full_name pattern' as method,
  id,
  user_id,
  full_name,
  email,
  status
FROM pendaftaran_tikrar_tahfidz
WHERE LOWER(full_name) LIKE '%agustina%'
  AND LOWER(full_name) LIKE '%eliyanti%';

-- Step 2: Update user_id if found
-- IMPORTANT: Run this ONLY after confirming which row matches from queries above!

-- Uncomment and modify this after confirming the correct registration_id:
-- UPDATE pendaftaran_tikrar_tahfidz
-- SET user_id = '5e1b7339-1584-4144-a299-1d8788714fef'
-- WHERE id = 'PASTE_CORRECT_REGISTRATION_ID_HERE';

-- Step 3: Verify the update
SELECT
  'VERIFICATION' as step,
  id,
  user_id,
  full_name,
  email,
  status,
  CASE
    WHEN user_id = '5e1b7339-1584-4144-a299-1d8788714fef' THEN 'CORRECT ✓'
    ELSE 'WRONG ✗'
  END as user_id_status
FROM pendaftaran_tikrar_tahfidz
WHERE id = 'PASTE_CORRECT_REGISTRATION_ID_HERE';
