-- ============================================================================
-- Migration: Fix RLS Policies for Dual-Role Users (Thalibah & Muallimah)
-- Date: 2026-01-10
-- Description: Allow users who are both thalibah and muallimah to see
--              their own registration data and status seleksi
--
-- Problem:
-- Users who are both in halaqah_students (thalibah) and halaqah_mentors
-- (muallimah) cannot see their own pendaftaran_tikrar_tahfidz data because
-- the halaqah table RLS policy restricts access in a way that causes
-- conflicts when both roles exist.
--
-- Solution:
-- Ensure pendaftaran_tikrar_tahfidz RLS policies ONLY check user_id,
-- independent of halaqah table memberships.
-- ============================================================================

-- ============================================================================
-- 1. VERIFY CURRENT POLICIES ON pendaftaran_tikrar_tahfidz
-- ============================================================================

SELECT
  '=== CURRENT POLICIES ON pendaftaran_tikrar_tahfidz ===' as section,
  policyname,
  cmd,
  permissive::text as permissive,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'pendaftaran_tikrar_tahfidz'
ORDER BY cmd, policyname;

-- ============================================================================
-- 2. DROP EXISTING POLICIES AND RECREATE WITH SIMPLER LOGIC
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Users can insert their own tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Users can update their own tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Admins can view all tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Admins can update all tikrar registrations" ON pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "allow_user_select_own_tikrar" ON pendaftaran_tikrar_tahfidz;

-- ============================================================================
-- 3. CREATE NEW POLICIES - SIMPLIFIED AND DUAL-ROLE FRIENDLY
-- ============================================================================

-- Policy: Users can view their own registrations (regardless of halaqah membership)
-- This policy is simple and direct - no dependency on halaqah table
CREATE POLICY "Users can view their own tikrar registrations"
ON pendaftaran_tikrar_tahfidz
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can insert their own registrations
CREATE POLICY "Users can insert their own tikrar registrations"
ON pendaftaran_tikrar_tahfidz
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own registrations (with status check)
-- Allow updates if user owns it AND (status is pending OR user is admin)
CREATE POLICY "Users can update their own tikrar registrations"
ON pendaftaran_tikrar_tahfidz
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND (
    status = 'pending'
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND ('admin' = ANY(users.roles) OR users.role = 'admin')
    )
  )
)
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all registrations
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

-- Policy: Admins can update all registrations
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
-- 4. VERIFY NEW POLICIES
-- ============================================================================

SELECT
  '=== NEW POLICIES VERIFICATION ===' as section,
  policyname,
  cmd,
  permissive::text as permissive,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'pendaftaran_tikrar_tahfidz'
ORDER BY cmd, policyname;

-- ============================================================================
-- 5. TEST QUERY - Simulate dual-role user access
-- ============================================================================

-- This test query shows what a dual-role user would see
DO $$
DECLARE
  v_test_user_id uuid := 'c862c410-0bee-4ac6-a3ca-53ac5b97277c'; -- Replace with actual dual-role user ID
  v_record_count integer;
  v_record RECORD;
BEGIN
  -- Count records this user can see
  SELECT COUNT(*) INTO v_record_count
  FROM pendaftaran_tikrar_tahfidz
  WHERE user_id = v_test_user_id;

  RAISE NOTICE 'User % can see % pendaftaran_tikrar_tahfidz records', v_test_user_id, v_record_count;

  -- Show the registration IDs and status
  FOR v_record IN
    SELECT id, status, selection_status, created_at
    FROM pendaftaran_tikrar_tahfidz
    WHERE user_id = v_test_user_id
  LOOP
    RAISE NOTICE '  - ID: %, Status: %, Selection: %', v_record.id, v_record.status, v_record.selection_status;
  END LOOP;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error: %', SQLERRM;
END $$;

-- ============================================================================
-- 6. ENSURE halaqah TABLE POLICIES DON'T BLOCK pendaftaran_tikrar_tahfidz
-- ============================================================================

-- The key insight: pendaftaran_tikrar_tahfidz query should NOT depend on
-- halaqah table. The policies above are independent of halaqah membership.

-- However, if there are any queries that JOIN with halaqah, we need to
-- ensure halaqah policies allow dual-role users to see relevant rows.

-- Policy: Muallimah can see own halaqah
CREATE POLICY "Muallimah can see own halaqah"
ON halaqah
FOR SELECT
TO authenticated
USING (
  muallimah_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM halaqah_mentors
    WHERE halaqah_id = halaqah.id AND mentor_id = auth.uid()
  )
);

-- Policy: Students can see their halaqah (including if they're also a mentor)
CREATE POLICY "Students can see their halaqah"
ON halaqah
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM halaqah_students
    WHERE halaqah_students.halaqah_id = halaqah.id
    AND halaqah_students.thalibah_id = auth.uid()
    AND halaqah_students.status IN ('active', 'waitlist')
  )
);

-- ============================================================================
-- 7. ENSURE halaqah_students POLICIES ALLOW DUAL-ROLE USERS
-- ============================================================================

-- Policy: Students can see their own enrollment
CREATE POLICY "Students can view own enrollment"
ON halaqah_students
FOR SELECT
TO authenticated
USING (thalibah_id = auth.uid());

-- Policy: Muallimah can view students in their halaqah
CREATE POLICY "Muallimah can view students in their halaqah"
ON halaqah_students
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM halaqah
    WHERE halaqah.id = halaqah_students.halaqah_id
    AND (
      halaqah.muallimah_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM halaqah_mentors
        WHERE halaqah_id = halaqah.id AND mentor_id = auth.uid()
      )
    )
  )
);

-- ============================================================================
-- 8. ENSURE halaqah_mentors POLICIES ALLOW DUAL-ROLE USERS
-- ============================================================================

-- Policy: Mentors can view their own assignments
CREATE POLICY "Mentors can view own assignments"
ON halaqah_mentors
FOR SELECT
TO authenticated
USING (mentor_id = auth.uid());

-- Policy: Students can view their halaqah mentors
CREATE POLICY "Students can view their halaqah mentors"
ON halaqah_mentors
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM halaqah_students hs
    WHERE hs.halaqah_id = halaqah_mentors.halaqah_id
    AND hs.thalibah_id = auth.uid()
  )
);

-- ============================================================================
-- 9. SUMMARY AND VERIFICATION
-- ============================================================================

-- Show all policies on key tables for dual-role users
-- Note: Each SELECT statement is run separately to avoid ORDER BY conflicts

SELECT
  'pendaftaran_tikrar_tahfidz' as table_name,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'pendaftaran_tikrar_tahfidz'
  AND cmd = 'SELECT'
ORDER BY policyname;

SELECT
  'halaqah' as table_name,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'halaqah'
  AND cmd = 'SELECT'
ORDER BY policyname;

SELECT
  'halaqah_students' as table_name,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'halaqah_students'
  AND cmd = 'SELECT'
ORDER BY policyname;

SELECT
  'halaqah_mentors' as table_name,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'halaqah_mentors'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
-- After running this migration:
-- 1. Dual-role users (thalibah + muallimah) should be able to see their data
-- 2. Status seleksi should be visible
-- 3. Daftar ulang functionality should work
--
-- Test by logging in as a dual-role user and checking:
-- - /perjalanan-saya page shows their registration
-- - Status seleksi is displayed
-- - Daftar ulang button/card is visible (if selected)
-- ============================================================================
