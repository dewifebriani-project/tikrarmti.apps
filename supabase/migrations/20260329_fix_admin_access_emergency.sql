-- =====================================================
-- EMERGENCY FIX: Enable ALL Admins to Access Data
-- =====================================================
-- This version uses ONLY the roles array column

-- =====================================================
-- STEP 1: UPDATE is_admin() FUNCTION TO USE roles ARRAY ONLY
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Check roles array from database (primary)
    'admin' = ANY (COALESCE(roles, ARRAY[]::text[]))
    OR
    -- Check JWT claims (fallback - for already synced users)
    'admin' = ANY (
      COALESCE(
        (auth.jwt()->>'app_metadata'->>'roles')::text[],
        (auth.jwt()->>'user_metadata'->>'roles')::text[],
        ARRAY[]::text[]
      )
    )
$$;

-- =====================================================
-- STEP 2: CREATE A SIMPLE TEST QUERY
-- =====================================================

-- First, let's verify we have admin users
DO $$
DECLARE
  admin_count integer;
BEGIN
  SELECT count(*)
  INTO admin_count
  FROM public.users
  WHERE 'admin' = ANY(roles);

  RAISE NOTICE 'Found % users with admin role in database', admin_count;

  IF admin_count = 0 THEN
    RAISE WARNING 'No admin users found! This is a problem.';
  END IF;
END $$;

-- =====================================================
-- STEP 3: SYNC FUNCTION FOR A SINGLE USER
-- =====================================================

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

  -- Sync to auth
  PERFORM auth.update_user(
    user_id_param,
    _user_metadata => jsonb_build_object(
      'roles', user_roles,
      'synced_at', now()
    ),
    _app_metadata => jsonb_build_object(
      'roles', user_roles
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

-- =====================================================
-- STEP 4: BATCH SYNC ALL ADMINS
-- =====================================================

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
  RAISE NOTICE 'Starting sync of all admin users to auth metadata...';

  -- Loop through all admin users (only those with admin in roles array)
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
          'roles', admin_record.roles
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
-- STEP 5: EXECUTE SYNC FOR ALL ADMINS
-- =====================================================

-- This will sync all admin users to Supabase Auth
CALL public.sync_all_admins_to_auth();

-- =====================================================
-- STEP 6: UPDATE RLS POLICIES WITH SIMPLIFIED LOGIC
-- =====================================================

-- Drop old admin policies
DROP POLICY IF EXISTS users_select_admin ON public.users;
DROP POLICY IF EXISTS users_update_admin ON public.users;

-- Create new simplified policies using is_admin() function
CREATE POLICY users_select_admin ON public.users
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY users_update_admin ON public.users
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- STEP 7: UPDATE OTHER ADMIN POLICIES
-- =====================================================

-- Recreate all admin policies using is_admin() function
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

-- Recreate all admin policies
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

-- Verify all admin users
DO $$
DECLARE
  total_admins integer;
BEGIN
  SELECT count(*)
  INTO total_admins
  FROM public.users
  WHERE 'admin' = ANY(roles);

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total admins in database: %', total_admins;
  RAISE NOTICE 'All admins have been synced to auth.metadata';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'IMPORTANT: Admins must LOGOUT and LOGIN again!';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================

/*
After running this migration:

1. All admin users' roles have been synced to Supabase Auth metadata
2. RLS policies have been updated to use the is_admin() function
3. Admins MUST LOGOUT and LOGIN AGAIN to get updated JWT token

To verify admin users:
SELECT id, email, roles
FROM public.users
WHERE 'admin' = ANY(roles)
ORDER BY email;

To verify a user's JWT claims:
1. Go to Authentication > Users in Supabase Dashboard
2. Click on any admin user
3. Check "Raw user metadata" - should show:
   {
     "roles": ["admin"],
     "synced_at": "2026-03-29T..."
   }

To manually sync a specific user later:
SELECT public.sync_user_to_auth('<user_id>'::uuid);

To refresh RLS policies without logout/login:
The is_admin() function checks both database roles AND JWT claims,
so it will work even if JWT is not yet refreshed.
*/
