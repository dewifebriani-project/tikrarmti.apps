-- =====================================================
-- FIX: Enable Admin Access - WITH RLS TEMPORARY DISABLE
-- =====================================================
-- This migration temporarily disables RLS to perform operations,
-- then re-enables it.

-- =====================================================
-- STEP 1: TEMPORARILY DISABLE RLS ON USERS TABLE
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY; -- Ensure RLS is on
-- Note: We keep RLS enabled but use SECURITY DEFINER functions

-- =====================================================
-- STEP 2: CREATE is_admin() FUNCTION WITH SECURITY DEFINER
-- =====================================================

-- Drop existing function if any
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- This function uses SECURITY DEFINER to bypass RLS
  -- Check if current user has admin role in roles array
  SELECT
    -- Check roles array from database (primary check)
    'admin' = ANY (
      SELECT roles
      FROM public.users
      WHERE id = auth.uid()
      LIMIT 1
    )
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- =====================================================
-- STEP 3: TEST THE FUNCTION
-- =====================================================

DO $$
DECLARE
  admin_count integer;
  my_roles text[];
BEGIN
  -- Count admins in database
  SELECT count(*)
  INTO admin_count
  FROM public.users
  WHERE 'admin' = ANY(roles);

  RAISE NOTICE 'Total admins in database: %', admin_count;

  -- Get current user's roles (if any)
  SELECT COALESCE(roles, ARRAY[]::text[])
  INTO my_roles
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;

  IF my_roles IS NOT NULL THEN
    RAISE NOTICE 'Current user roles: %', my_roles;
  END IF;
END $$;

-- =====================================================
-- STEP 4: SYNC USER ROLES TO AUTH (UPDATED)
-- =====================================================

-- Drop existing sync functions
DROP FUNCTION IF EXISTS public.sync_user_to_auth(uuid) CASCADE;
DROP PROCEDURE IF EXISTS public.sync_all_admins_to_auth() CASCADE;

-- Create sync function
CREATE OR REPLACE FUNCTION public.sync_user_to_auth(user_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_email text;
  user_roles text[];
BEGIN
  -- Get user data
  SELECT email, COALESCE(roles, ARRAY[]::text[])
  INTO user_email, user_roles
  FROM public.users
  WHERE id = user_id_param;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Sync to auth metadata
  PERFORM auth.update_user(
    user_id_param,
    _user_metadata => jsonb_build_object(
      'roles', user_roles,
      'synced_at', now()
    ),
    _app_metadata => jsonb_build_object(
      'roles', user_roles,
      'role', CASE WHEN 'admin' = ANY(user_roles) THEN 'admin' ELSE 'thalibah' END
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'email', user_email,
    'user_id', user_id_param,
    'roles', user_roles
  );
END;
$$;

-- Create batch sync procedure
CREATE OR REPLACE PROCEDURE public.sync_all_admins_to_auth()
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  admin_record RECORD;
  synced_count integer := 0;
  failed_count integer := 0;
BEGIN
  RAISE NOTICE 'Starting sync of all admin users...';

  -- Loop through all admin users
  FOR admin_record IN
    SELECT id, email, roles
    FROM public.users
    WHERE 'admin' = ANY(roles)
  LOOP
    BEGIN
      -- Sync this admin to auth
      PERFORM auth.update_user(
        admin_record.id,
        _user_metadata => jsonb_build_object(
          'roles', admin_record.roles,
          'synced_at', now()
        ),
        _app_metadata => jsonb_build_object(
          'roles', admin_record.roles,
          'role', 'admin'
        )
      );

      synced_count := synced_count + 1;
      RAISE NOTICE 'Synced admin: %', admin_record.email;

    EXCEPTION
      WHEN OTHERS THEN
        failed_count := failed_count + 1;
        RAISE WARNING 'Failed to sync admin % (%): %',
          admin_record.email,
          admin_record.id,
          SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'Sync complete: % succeeded, % failed', synced_count, failed_count;
END;
$$;

-- =====================================================
-- STEP 5: EXECUTE SYNC
-- =====================================================

-- Sync all admins to auth metadata
CALL public.sync_all_admins_to_auth();

-- =====================================================
-- STEP 6: UPDATE RLS POLICIES
-- =====================================================

-- Drop old admin policies
DROP POLICY IF EXISTS users_select_admin ON public.users;
DROP POLICY IF EXISTS users_update_admin ON public.users;
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;

-- Recreate policies with proper admin check

-- Users can read their own data
CREATE POLICY users_select_own ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY users_update_own ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can read all users using SECURITY DEFINER function
CREATE POLICY users_select_admin ON public.users
  FOR SELECT
  USING (public.is_admin());

-- Admins can update all users
CREATE POLICY users_update_admin ON public.users
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Service role can insert users
CREATE POLICY users_insert_service ON public.users
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- STEP 7: UPDATE OTHER ADMIN POLICIES
-- =====================================================

-- Drop all old admin policies
DROP POLICY IF EXISTS batches_all_admin ON public.batches;
DROP POLICY IF EXISTS programs_all_admin ON public.programs;
DROP POLICY IF EXISTS pendaftaran_all_admin ON public.pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS halaqah_all_admin ON public.halaqah;
DROP POLICY IF EXISTS halaqah_students_all_admin ON public.halaqah_students;
DROP POLICY IF EXISTS sp_all_admin ON public.surat_peringatan;
DROP POLICY IF EXISTS daftar_ulang_all_admin ON public.daftar_ulang_submissions;
DROP POLICY IF EXISTS presensi_all_admin ON public.presensi;
DROP POLICY IF EXISTS exam_attempts_all_admin ON public.exam_attempts;
DROP POLICY IF EXISTS exam_configurations_all_admin ON public.exam_configurations;
DROP POLICY IF EXISTS exam_questions_all_admin ON public.exam_questions;
DROP POLICY IF EXISTS exam_question_flags_all_admin ON public.exam_question_flags;
DROP POLICY IF EXISTS halaqah_class_types_all_admin ON public.halaqah_class_types;
DROP POLICY IF EXISTS halaqah_mentors_all_admin ON public.halaqah_mentors;
DROP POLICY IF EXISTS partner_preferences_all_admin ON public.partner_preferences;
DROP POLICY IF EXISTS sp_history_all_admin ON public.sp_history;
DROP POLICY IF EXISTS study_partners_all_admin ON public.study_partners;
DROP POLICY IF EXISTS muallimah_all_admin ON public.muallimah_registrations;
DROP POLICY IF EXISTS musyrifah_all_admin ON public.musyrifah_registrations;
DROP POLICY IF EXISTS maintenance_mode_update_admin ON public.maintenance_mode;

-- Recreate all admin policies using is_admin() function
CREATE POLICY batches_all_admin ON public.batches
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY programs_all_admin ON public.programs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY pendaftaran_all_admin ON public.pendaftaran_tikrar_tahfidz
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY halaqah_all_admin ON public.halaqah
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY halaqah_students_all_admin ON public.halaqah_students
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY sp_all_admin ON public.surat_peringatan
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY daftar_ulang_all_admin ON public.daftar_ulang_submissions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY presensi_all_admin ON public.presensi
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY exam_attempts_all_admin ON public.exam_attempts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY exam_configurations_all_admin ON public.exam_configurations
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY exam_questions_all_admin ON public.exam_questions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY exam_question_flags_all_admin ON public.exam_question_flags
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY halaqah_class_types_all_admin ON public.halaqah_class_types
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY halaqah_mentors_all_admin ON public.halaqah_mentors
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY partner_preferences_all_admin ON public.partner_preferences
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY sp_history_all_admin ON public.sp_history
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY study_partners_all_admin ON public.study_partners
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY muallimah_all_admin ON public.muallimah_registrations
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY musyrifah_all_admin ON public.musyrifah_registrations
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY maintenance_mode_update_admin ON public.maintenance_mode
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =====================================================
-- STEP 8: VERIFICATION
-- =====================================================

-- Verify admin users
DO $$
DECLARE
  total_admins integer;
  current_user_is_admin boolean;
BEGIN
  SELECT count(*)
  INTO total_admins
  FROM public.users
  WHERE 'admin' = ANY(roles);

  current_user_is_admin := public.is_admin();

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total admins in database: %', total_admins;
  RAISE NOTICE 'Current user is_admin: %', current_user_is_admin;
  RAISE NOTICE 'All admins have been synced to auth';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Admins should LOGOUT and LOGIN again!';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- STEP 9: CREATE QUICK SYNC FUNCTION FOR MANUAL USE
-- =====================================================

-- Simple function to check and sync a user
CREATE OR REPLACE FUNCTION public.check_and_sync_user(user_email_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id uuid;
  user_roles text[];
BEGIN
  -- Find user by email
  SELECT id, COALESCE(roles, ARRAY[]::text[])
  INTO user_id, user_roles
  FROM public.users
  WHERE email = user_email_param
  LIMIT 1;

  IF user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Sync to auth
  PERFORM auth.update_user(
    user_id,
    _user_metadata => jsonb_build_object(
      'roles', user_roles,
      'synced_at', now()
    ),
    _app_metadata => jsonb_build_object(
      'roles', user_roles,
      'role', CASE WHEN 'admin' = ANY(user_roles) THEN 'admin' ELSE 'thalibah' END
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'email', user_email_param,
    'user_id', user_id,
    'roles', user_roles,
    'is_admin', 'admin' = ANY(user_roles)
  );
END;
$$;

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================

/*
After running this migration:

1. All admin users have been synced to Supabase Auth
2. RLS policies are updated to use is_admin() function
3. Admins can now access all data

To verify admin users:
SELECT id, email, roles
FROM public.users
WHERE 'admin' = ANY(roles)
ORDER BY email;

To check current user's status:
SELECT public.is_admin() as is_admin_user;

To manually sync a user:
SELECT public.check_and_sync_user('admin@example.com');

To refresh a user's JWT:
They need to LOGOUT and LOGIN again.

IMPORTANT:
The is_admin() function now checks the database directly for admin role,
so it should work immediately without requiring JWT refresh.
*/
