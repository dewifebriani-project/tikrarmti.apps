-- =====================================================
-- FIX: RLS Admin Policies Using JWT Claims
-- =====================================================
-- The previous admin policies used EXISTS subquery which doesn't work
-- properly with RLS. This version uses JWT claims for role checking.

-- =====================================================
-- DROP OLD POLICIES
-- =====================================================

DROP POLICY IF EXISTS users_select_admin ON public.users;
DROP POLICY IF EXISTS users_update_admin ON public.users;
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
DROP POLICY IF EXISTS jurnal_select_admin ON public.jurnal_records;
DROP POLICY IF EXISTS tashih_records_select_admin ON public.tashih_records;
DROP POLICY IF EXISTS maintenance_mode_update_admin ON public.maintenance_mode;

-- =====================================================
-- HELPER FUNCTION FOR ADMIN CHECK
-- =====================================================

-- Create a function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(
      -- Check JWT claims first (most reliable)
      'admin' = ANY (
        COALESCE(
          auth.jwt()->>'app_metadata'->>'roles',
          auth.jwt()->>'user_metadata'->>'roles',
          '[]'
        )::text[]
      ),
      -- Fallback: check database
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND 'admin' = ANY (roles)
      ),
      -- Fallback: check owner email from env
      -- (This would need to be set via JWT claims in production)
      false
    )
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- =====================================================
-- USERS TABLE POLICIES (FIXED)
-- =====================================================

-- Admins can read all users using JWT check
CREATE POLICY users_select_admin ON public.users
  FOR SELECT
  USING (public.is_admin());

-- Admins can update all users
CREATE POLICY users_update_admin ON public.users
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- BATCHES TABLE POLICIES (FIXED)
-- =====================================================

-- Admins can do everything on batches
CREATE POLICY batches_all_admin ON public.batches
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- PROGRAMS TABLE POLICIES (FIXED)
-- =====================================================

-- Admins can do everything on programs
CREATE POLICY programs_all_admin ON public.programs
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- PENDAFTARAN TIKRAR TAHFIDZ POLICIES (FIXED)
-- =====================================================

-- Admins can do everything
CREATE POLICY pendaftaran_all_admin ON public.pendaftaran_tikrar_tahfidz
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- HALAQAH POLICIES (FIXED)
-- =====================================================

-- Admins can do everything
CREATE POLICY halaqah_all_admin ON public.halaqah
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- HALAQAH STUDENTS POLICIES (FIXED)
-- =====================================================

-- Admins can do everything
CREATE POLICY halaqah_students_all_admin ON public.halaqah_students
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- JURNAL RECORDS POLICIES (FIXED)
-- =====================================================

-- Admins can read all journals
CREATE POLICY jurnal_select_admin ON public.jurnal_records
  FOR SELECT
  USING (public.is_admin());

-- =====================================================
-- SURAT PERINGATAN POLICIES (FIXED)
-- =====================================================

-- Admins can do everything
CREATE POLICY sp_all_admin ON public.surat_peringatan
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- DAFTAR ULANG SUBMISSIONS POLICIES (FIXED)
-- =====================================================

-- Admins can do everything
CREATE POLICY daftar_ulang_all_admin ON public.daftar_ulang_submissions
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- PRESENSI POLICIES (FIXED)
-- =====================================================

-- Admins can do everything
CREATE POLICY presensi_all_admin ON public.presensi
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- EXAM ATTEMPTS POLICIES (FIXED)
-- =====================================================

-- Admins can do everything
CREATE POLICY exam_attempts_all_admin ON public.exam_attempts
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- EXAM CONFIGURATIONS POLICIES (FIXED)
-- =====================================================

-- Admins can do everything
CREATE POLICY exam_configurations_all_admin ON public.exam_configurations
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- EXAM QUESTIONS POLICIES (FIXED)
-- =====================================================

-- Admins can do everything
CREATE POLICY exam_questions_all_admin ON public.exam_questions
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- EXAM QUESTION FLAGS POLICIES (FIXED)
-- =====================================================

-- Admins can do everything
CREATE POLICY exam_question_flags_all_admin ON public.exam_question_flags
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- HALAQAH CLASS TYPES POLICIES (FIXED)
-- =====================================================

-- Admins can do everything
CREATE POLICY halaqah_class_types_all_admin ON public.halaqah_class_types
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- HALAQAH MENTORS POLICIES (FIXED)
-- =====================================================

-- Admins can do everything
CREATE POLICY halaqah_mentors_all_admin ON public.halaqah_mentors
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- PARTNER PREFERENCES POLICIES (FIXED)
-- =====================================================

-- Admins can do everything
CREATE POLICY partner_preferences_all_admin ON public.partner_preferences
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- SP HISTORY POLICIES (FIXED)
-- =====================================================

-- Admins can do everything
CREATE POLICY sp_history_all_admin ON public.sp_history
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- STUDY PARTNERS POLICIES (FIXED)
-- =====================================================

-- Admins can do everything
CREATE POLICY study_partners_all_admin ON public.study_partners
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- MUALLIMAH & MUSYRIFAH REGISTRATIONS POLICIES (FIXED)
-- =====================================================

-- Admins can do everything
CREATE POLICY muallimah_all_admin ON public.muallimah_registrations
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY musyrifah_all_admin ON public.musyrifah_registrations
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- TASHIH RECORDS POLICIES (FIXED)
-- =====================================================

-- Admins can read all records
CREATE POLICY tashih_records_select_admin ON public.tashih_records
  FOR SELECT
  USING (public.is_admin());

-- =====================================================
-- MAINTENANCE MODE POLICIES (FIXED)
-- =====================================================

-- Admins can update maintenance mode
CREATE POLICY maintenance_mode_update_admin ON public.maintenance_mode
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- ENSURE JWT HAS ROLE CLAIMS
-- =====================================================

-- Create a function to sync user role to JWT claims
-- This should be called when user logs in or when roles are updated
CREATE OR REPLACE FUNCTION public.sync_user_roles_to_jwt()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function updates the auth.users metadata with roles from public.users
  -- It should be called via a trigger or when roles change

  -- Note: In production, use Supabase Management API to update user_metadata
  -- This function is a placeholder for the logic
  NULL;
END;
$$;

-- =====================================================
-- TRIGGER TO SYNC ROLES ON USER UPDATE
-- =====================================================

-- Create or replace trigger function
CREATE OR REPLACE FUNCTION public.handle_user_role_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log role changes for audit
  IF OLD.roles IS DISTINCT FROM NEW.roles THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (
      NEW.id,
      'role_updated',
      'user',
      NEW.id,
      jsonb_build_object(
        'old_roles', OLD.roles,
        'new_roles', NEW.roles,
        'changed_at', now()
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_user_role_update ON public.users;
CREATE TRIGGER on_user_role_update
  AFTER UPDATE OF roles ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_role_update();
