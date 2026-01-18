-- Debug script to check if role update is working
-- Run this in Supabase SQL Editor

-- 1. Check current roles for a specific user (replace with actual user_id)
SELECT
  id,
  email,
  full_name,
  role,
  roles,
  updated_at
FROM users
WHERE id IN (
  -- Replace with actual user IDs you're trying to upgrade
  -- Example user IDs - add yours here
  SELECT id FROM users
  WHERE email LIKE '%test%'
  LIMIT 5
)
ORDER BY updated_at DESC;

-- 2. Check RLS policies on users table
SELECT
  policyname,
  cmd,
  with_check,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
ORDER BY policyname;

-- 3. Test manual update (replace USER_ID with actual ID)
-- Uncomment to test:
/*
UPDATE users
SET
  role = 'thalibah',
  roles = ARRAY['thalibah']::text[]
WHERE id = 'USER_ID'
RETURNING id, email, role, roles, updated_at;
*/

-- 4. Check if triggers exist on users table
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users'
ORDER BY trigger_name;
