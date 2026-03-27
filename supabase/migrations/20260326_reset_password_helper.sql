-- ============================================================================
-- RESET PASSWORD HELPER - SUPABASE AUTH
-- ============================================================================
-- This SQL script helps reset user passwords in Supabase Auth
-- Run this in Supabase Dashboard → SQL Editor

-- ============================================================================
-- OPTION 1: Reset Password for Specific User (by Email)
-- ============================================================================
-- This will send a password reset email to the user

-- Replace 'user@example.com' with the actual email address
SELECT auth.email_reset_password_token(
  'user@example.com'  -- Replace with user email
);

-- ============================================================================
-- OPTION 2: Direct Password Reset (Admin Only)
-- ============================================================================
-- WARNING: This bypasses email verification and should ONLY be used for testing
-- or emergency situations by authorized admins.

-- Step 1: Get the user ID first
SELECT id, email, created_at
FROM auth.users
WHERE email = 'user@example.com';  -- Replace with user email to find their ID

-- Step 2: Reset password directly (replace USER_ID and NEW_PASSWORD)
-- SECURITY NOTE: In production, use a strong random password instead of hardcoded ones
UPDATE auth.users
SET encrypted_password = crypt('NewPassword123!', gen_salt('bf'))
WHERE id = 'USER_ID_HERE';  -- Replace with actual user ID from step 1

-- Step 3: Clear any failed login attempts (optional)
DELETE FROM auth.failed_login_attempts
WHERE user_id = 'USER_ID_HERE';  -- Replace with actual user ID

-- ============================================================================
-- OPTION 3: Reset Multiple Admin Passwords at Once
-- ============================================================================
-- Reset passwords for all users with 'admin' role
-- WARNING: Use with extreme caution!

DO $$
DECLARE
  user_record RECORD;
  new_password TEXT;
BEGIN
  FOR user_record IN
    SELECT u.id, u.email
    FROM auth.users u
    JOIN public.users p ON u.id = p.id
    WHERE 'admin' = ANY(p.roles)
  LOOP
    -- Generate a simple password (in production, use secure random passwords)
    new_password := 'Admin123!';

    -- Update password
    UPDATE auth.users
    SET encrypted_password = crypt(new_password, gen_salt('bf'))
    WHERE id = user_record.id;

    RAISE NOTICE 'Reset password for: % (new password: %)', user_record.email, new_password;
  END LOOP;
END $$;

-- ============================================================================
-- OPTION 4: List All Users (for debugging)
-- ============================================================================
-- List all users with their roles to help identify which account to reset

SELECT
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at,
  u.email_confirmed_at,
  p.roles,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.users p ON u.id = p.id
ORDER BY u.created_at DESC;

-- ============================================================================
-- OPTION 5: Create/Update Admin User with Specific Password
-- ============================================================================
-- This creates or updates an admin user with a known password

-- First, check if user exists
DO $$
DECLARE
  v_user_id TEXT;
  v_admin_email TEXT := 'admin@tikrarmti.com';
  v_admin_password TEXT := 'AdminTikrar123!';
BEGIN
  -- Check if user exists in auth
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_admin_email;

  IF v_user_id IS NOT NULL THEN
    -- Update existing user password
    UPDATE auth.users
    SET encrypted_password = crypt(v_admin_password, gen_salt('bf'))
    WHERE id = v_user_id;

    RAISE NOTICE 'Updated password for existing admin: %', v_admin_email;

    -- Also ensure user exists in public.users with admin role
    INSERT INTO public.users (id, email, full_name, role, roles, created_at, updated_at)
    VALUES (v_user_id, v_admin_email, 'Administrator', 'admin', ARRAY['admin'], NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      roles = ARRAY['admin'],
      role = 'admin',
      updated_at = NOW();
  ELSE
    RAISE NOTICE 'Admin user % does not exist. Please create via registration.', v_admin_email;
  END IF;
END $$;

-- ============================================================================
-- VERIFY: Check if password reset was successful
-- ============================================================================
-- After resetting, you can verify by checking the password update time

SELECT
  email,
  updated_at,
  updated_at > NOW() - INTERVAL '5 minutes' as "Recently Updated?"
FROM auth.users
WHERE email = 'user@example.com';  -- Replace with the email you reset
