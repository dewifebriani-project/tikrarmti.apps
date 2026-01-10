-- ============================================================================
-- FIX: Allow Dual-Role Users (Thalibah & Muallimah) to See Their Data
-- ============================================================================
--
-- Problem: Users who are both thalibah (halaqah_students) and muallimah
-- (halaqah_mentors) cannot see their own pendaftaran data on perjalanan-saya page.
--
-- Root Cause: RLS policies on pendaftaran_tikrar_tahfidz may have conflicts
-- when user has multiple roles.
--
-- Solution: Simplify RLS policies to ONLY check user_id, independent of
-- halaqah membership or other roles.
--
-- INSTRUCTIONS:
-- 1. Go to https://supabase.com/dashboard/project/nmbvklixthlqtkkgqnjl
-- 2. Click "SQL Editor" in left sidebar
-- 3. Click "New Query"
-- 4. Paste this entire SQL script
-- 5. Click "Run" button
-- ============================================================================

-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "Users can view their own tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Users can insert their own tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Users can update their own tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Admins can view all tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Admins can update all tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "allow_user_select_own_tikrar" ON pendaftaran_tikrar_tahfidz;

-- Step 2: Create simplified SELECT policy (allows users to see own data)
CREATE POLICY "Users can view their own tikrar registrations"
ON pendaftaran_tikrar_tahfidz
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Step 3: Create INSERT policy
CREATE POLICY "Users can insert their own tikrar registrations"
ON pendaftaran_tikrar_tahfidz
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Step 4: Create UPDATE policy (allow users to update own pending registrations)
CREATE POLICY "Users can update their own tikrar registrations"
ON pendaftaran_tikrar_tahfidz
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id);

-- Step 5: Create Admin policies
CREATE POLICY "Admins can view all tikrar registrations"
ON pendaftaran_tikrar_tahfidz
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND ('admin' = ANY(users.roles) OR users.role = 'admin')
  )
);

CREATE POLICY "Admins can update all tikrar registrations"
ON pendaftaran_tikrar_tahfidz
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND ('admin' = ANY(users.roles) OR users.role = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND ('admin' = ANY(users.roles) OR users.role = 'admin')
  )
);

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this after applying the fix to verify policies are correct:

-- Show all policies on pendaftaran_tikrar_tahfidz
SELECT
  'Policy Verification' as section,
  policyname,
  cmd,
  qual as using_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'pendaftaran_tikrar_tahfidz'
ORDER BY cmd, policyname;

-- Expected output should show these policies:
-- 1. "Users can view their own tikrar registrations" - SELECT - auth.uid() = user_id
-- 2. "Users can insert their own tikrar registrations" - INSERT
-- 3. "Users can update their own tikrar registrations" - UPDATE - auth.uid() = user_id AND status = 'pending'
-- 4. "Admins can view all tikrar registrations" - SELECT
-- 5. "Admins can update all tikrar registrations" - UPDATE
-- ============================================================================
-- After running this, dual-role users should be able to:
-- 1. See their registration data on perjalanan-saya page
-- 2. See status seleksi
-- 3. Access daftar ulang functionality (if selected)
-- ============================================================================
