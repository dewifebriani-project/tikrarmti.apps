-- =====================================================
-- DIAGNOSTIC & FIX SCRIPT FOR ADMIN ROLE ISSUE
-- =====================================================
-- This script helps diagnose and fix admin access issues
-- caused by the dual role columns (role vs roles)
-- =====================================================

-- STEP 1: Check current state of users table
-- Run this first to see what's in your database

-- View all users with their role columns
SELECT
  id,
  email,
  full_name,
  role,        -- VARCHAR column
  roles,       -- ARRAY column
  created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 20;

-- STEP 2: Find users with inconsistent role data
-- This shows users where one column says 'admin' but the other doesn't

SELECT
  id,
  email,
  full_name,
  role,
  roles,
  CASE
    WHEN role = 'admin' AND NOT (roles @> ARRAY['admin']::text[]) THEN 'role=admin but roles missing admin'
    WHEN role <> 'admin' AND (roles @> ARRAY['admin']::text[]) THEN 'roles has admin but role!=admin'
    WHEN role = 'admin' AND (roles @> ARRAY['admin']::text[]) THEN 'BOTH columns have admin'
    ELSE 'Neither column has admin'
  END as status
FROM public.users
WHERE role = 'admin' OR (roles @> ARRAY['admin']::text[]);

-- STEP 3: Fix specific user by email
-- Replace 'user_email@example.com' with the actual email

-- First, check what this user currently has:
SELECT
  id,
  email,
  full_name,
  role,
  roles
FROM public.users
WHERE email = 'YOUR_EMAIL_HERE';  -- Replace this!

-- STEP 4: Update BOTH role columns for specific user by email
-- This ensures both client and server checks will work

UPDATE public.users
SET
  role = 'admin',                    -- For server-side API checks
  roles = ARRAY['admin']::text[],    -- For client-side checks
  updated_at = NOW()
WHERE email = 'YOUR_EMAIL_HERE';      -- Replace this!

-- STEP 5: Alternative - Update by user_id if you know it
-- Use this if the email doesn't work

UPDATE public.users
SET
  role = 'admin',
  roles = ARRAY['admin']::text[],
  updated_at = NOW()
WHERE id = 'YOUR_USER_ID_HERE';      -- Replace this!

-- STEP 6: Verify the fix
SELECT
  id,
  email,
  full_name,
  role,
  roles,
  updated_at
FROM public.users
WHERE email = 'YOUR_EMAIL_HERE'       -- Replace this!
   OR id = 'YOUR_USER_ID_HERE';       -- Replace this!

-- =====================================================
-- LONG-TERM FIX: Database trigger to keep both columns in sync
-- =====================================================
-- Uncomment and run this to automatically sync role and roles columns

/*
-- Create function to sync role columns
CREATE OR REPLACE FUNCTION sync_role_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- When 'role' is updated, update 'roles' array to match
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NEW.role = 'admin' THEN
      NEW.roles := ARRAY['admin']::text[];
    ELSIF NEW.role = 'muallimah' THEN
      NEW.roles := ARRAY['muallimah']::text[];
    ELSIF NEW.role = 'thalibah' THEN
      NEW.roles := ARRAY['thalibah']::text[];
    ELSIF NEW.role = 'musyrifah' THEN
      NEW.roles := ARRAY['musyrifah']::text[];
    ELSIF NEW.role = 'pengurus' THEN
      NEW.roles := ARRAY['pengurus']::text[];
    ELSE
      NEW.roles := ARRAY[]::text[];
    END IF;
  END IF;

  -- When 'roles' array is updated, update 'role' varchar to match (first role)
  IF NEW.roles IS DISTINCT FROM OLD.roles THEN
    IF NEW.roles @> ARRAY['admin']::text[] THEN
      NEW.role := 'admin';
    ELSIF NEW.roles @> ARRAY['muallimah']::text[] THEN
      NEW.role := 'muallimah';
    ELSIF NEW.roles @> ARRAY['thalibah']::text[] THEN
      NEW.role := 'thalibah';
    ELSIF NEW.roles @> ARRAY['musyrifah']::text[] THEN
      NEW.role := 'musyrifah';
    ELSIF NEW.roles @> ARRAY['pengurus']::text[] THEN
      NEW.role := 'pengurus';
    ELSE
      NEW.role := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS sync_role_columns_trigger ON public.users;
CREATE TRIGGER sync_role_columns_trigger
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_role_columns();
*/

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. The application uses BOTH columns inconsistently:
--    - Server APIs: Check 'role' (VARCHAR)
--    - Client pages: Check 'roles' (ARRAY)
--
-- 2. Quick fix: Update BOTH columns manually (STEP 4 or 5)
--
-- 3. Permanent fix: Run the trigger in STEP 6
--
-- 4. After updating, the user should:
--    - Log out
--    - Clear browser cache/localStorage
--    - Log back in
-- =====================================================
