-- ============================================================================
-- EMERGENCY ADMIN FIX - Ensure admin can login and access data
-- ============================================================================
-- This script bypasses RLS for admin users to ensure they can always access data
--
-- IMPORTANT: This should be run if admin is locked out or cannot login
-- ============================================================================

-- First, let's check if your admin user has the correct roles
-- Replace 'YOUR_ADMIN_EMAIL' with your actual admin email
SELECT id, email, full_name, role, roles
FROM users
WHERE email = 'YOUR_ADMIN_EMAIL';  -- Replace with your admin email

-- If your admin user doesn't have 'admin' in roles array, update it:
-- UPDATE users
-- SET roles = ARRAY['admin', 'super_admin']
-- WHERE email = 'YOUR_ADMIN_EMAIL';  -- Replace with your admin email

-- ============================================================================
-- CREATE SUPER ADMIN POLICY THAT BYPASSES RLS
-- ============================================================================
-- This creates a more permissive policy for super admins

-- Drop existing restrictive policies on users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Recreate user policies with proper roles array check
CREATE POLICY "Users can view their own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================================================
-- ADD SERVICE ROLE BYPASS POLICY
-- ============================================================================
-- This allows service role to bypass RLS entirely

-- Check if service role policies exist, if not create them
CREATE POLICY IF NOT EXISTS "Service role can bypass all RLS"
ON users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- For pendaftaran_tikrar_tahfidz
CREATE POLICY IF NOT EXISTS "Service role bypass on pendaftaran"
ON pendaftaran_tikrar_tahfidz
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- For daftar_ulang_submissions
CREATE POLICY IF NOT EXISTS "Service role bypass on submissions"
ON public.daftar_ulang_submissions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- List all policies on the tables
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  rolname
FROM pg_policies
WHERE tablename IN ('users', 'pendaftaran_tikrar_tahfidz', 'daftar_ulang_submissions')
ORDER BY tablename, policyname;

-- Check your admin user's current roles
-- Replace YOUR_ADMIN_EMAIL with your actual email
SELECT
  id,
  email,
  full_name,
  role,
  roles,
  created_at
FROM users
WHERE email LIKE '%admin%' OR 'admin' = ANY(roles);
