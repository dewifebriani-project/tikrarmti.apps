-- =====================================================
-- CRITICAL SECURITY FIX: Enable and Configure RLS
-- =====================================================
-- This migration enables Row Level Security on all sensitive tables
-- and creates proper policies to prevent unauthorized access.

-- =====================================================
-- DROP DANGEROUS EXISTING POLICIES
-- =====================================================

DROP POLICY IF EXISTS users_all_policy ON public.users;
DROP POLICY IF EXISTS users_select_policy ON public.users;
DROP POLICY IF EXISTS batches_admin_all ON public.batches;
DROP POLICY IF EXISTS batches_public_select ON public.batches;
DROP POLICY IF EXISTS programs_admin_all ON public.programs;
DROP POLICY IF EXISTS programs_public_select ON public.programs;

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blacklist_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daftar_ulang_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_question_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halaqah ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halaqah_class_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halaqah_mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halaqah_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurnal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muallimah_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.musyrifah_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pendaftaran_tikrar_tahfidz ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presensi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surat_peringatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tashih_records ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can read their own data
CREATE POLICY users_select_own ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data (except roles, email)
CREATE POLICY users_update_own ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Prevent role changes
    (CASE WHEN roles IS DISTINCT FROM (SELECT roles FROM public.users WHERE id = auth.uid())
      THEN false ELSE true END) AND
    -- Prevent email changes
    email = (SELECT email FROM public.users WHERE id = auth.uid())
  );

-- Admins can read all users
CREATE POLICY users_select_admin ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- Admins can update all users
CREATE POLICY users_update_admin ON public.users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- Service role can insert users
CREATE POLICY users_insert_service ON public.users
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- BATCHES TABLE POLICIES
-- =====================================================

-- Authenticated users can read active batches
CREATE POLICY batches_select_public ON public.batches
  FOR SELECT
  USING (status IN ('open', 'closed'));

-- Admins can do everything on batches
CREATE POLICY batches_all_admin ON public.batches
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- =====================================================
-- PROGRAMS TABLE POLICIES
-- =====================================================

-- Authenticated users can read programs
CREATE POLICY programs_select_public ON public.programs
  FOR SELECT
  USING (true);

-- Admins can do everything on programs
CREATE POLICY programs_all_admin ON public.programs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- =====================================================
-- PENDAFTARAN TIKRAR TAHFIDZ POLICIES
-- =====================================================

-- Users can read their own registrations
CREATE POLICY pendaftaran_select_own ON public.pendaftaran_tikrar_tahfidz
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own registrations
CREATE POLICY pendaftaran_insert_own ON public.pendaftaran_tikrar_tahfidz
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own registrations (limited fields)
CREATE POLICY pendaftaran_update_own ON public.pendaftaran_tikrar_tahfidz
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    -- Only allow updating specific fields before approval
    CASE
      WHEN status = 'pending' THEN true
      ELSE false
    END
  );

-- Admins can do everything
CREATE POLICY pendaftaran_all_admin ON public.pendaftaran_tikrar_tahfidz
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- =====================================================
-- HALAQAH POLICIES
-- =====================================================

-- Authenticated users can read halaqah
CREATE POLICY halaqah_select_public ON public.halaqah
  FOR SELECT
  USING (true);

-- Admins can do everything
CREATE POLICY halaqah_all_admin ON public.halaqah
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- =====================================================
-- HALAQAH STUDENTS POLICIES
-- =====================================================

-- Users can read their own halaqah assignments
CREATE POLICY halaqah_students_select_own ON public.halaqah_students
  FOR SELECT
  USING (auth.uid() = thalibah_id);

-- Admins can do everything
CREATE POLICY halaqah_students_all_admin ON public.halaqah_students
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- =====================================================
-- JURNAL RECORDS POLICIES
-- =====================================================

-- Users can read their own journals
CREATE POLICY jurnal_select_own ON public.jurnal_records
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own journals
CREATE POLICY jurnal_insert_own ON public.jurnal_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own journals
CREATE POLICY jurnal_update_own ON public.jurnal_records
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can read all journals
CREATE POLICY jurnal_select_admin ON public.jurnal_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- =====================================================
-- SURAT PERINGATAN POLICIES
-- =====================================================

-- Users can read their own SPs
CREATE POLICY sp_select_own ON public.surat_peringatan
  FOR SELECT
  USING (auth.uid() = thalibah_id);

-- Admins can do everything
CREATE POLICY sp_all_admin ON public.surat_peringatan
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- =====================================================
-- DAFTAR ULANG SUBMISSIONS POLICIES
-- =====================================================

-- Users can read their own submissions
CREATE POLICY daftar_ulang_select_own ON public.daftar_ulang_submissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own submissions
CREATE POLICY daftar_ulang_insert_own ON public.daftar_ulang_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY daftar_ulang_all_admin ON public.daftar_ulang_submissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- =====================================================
-- PRESENSI POLICIES
-- =====================================================

-- Users can read their own presensi
CREATE POLICY presensi_select_own ON public.presensi
  FOR SELECT
  USING (auth.uid() = thalibah_id);

-- Admins can do everything
CREATE POLICY presensi_all_admin ON public.presensi
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- =====================================================
-- EXAM ATTEMPTS POLICIES
-- =====================================================

-- Users can read their own exam attempts
CREATE POLICY exam_attempts_select_own ON public.exam_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own attempts
CREATE POLICY exam_attempts_insert_own ON public.exam_attempts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own in-progress attempts
CREATE POLICY exam_attempts_update_own ON public.exam_attempts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = 'in_progress');

-- Admins can do everything
CREATE POLICY exam_attempts_all_admin ON public.exam_attempts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- =====================================================
-- AUDIT LOGS POLICIES (Admin Only)
-- =====================================================

-- Only admins can read audit logs
CREATE POLICY audit_logs_select_admin ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- Service role can insert audit logs
CREATE POLICY audit_logs_insert_service ON public.audit_logs
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- SYSTEM LOGS POLICIES (Admin Only)
-- =====================================================

-- Only admins can read system logs
CREATE POLICY system_logs_select_admin ON public.system_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- Service role can insert system logs
CREATE POLICY system_logs_insert_service ON public.system_logs
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- JUZ OPTIONS (Public Read)
-- =====================================================

-- Everyone can read juz options
CREATE POLICY juz_options_select_public ON public.juz_options
  FOR SELECT
  USING (true);

-- =====================================================
-- MUALLIMAH & MUSYRIFAH REGISTRATIONS
-- =====================================================

-- Users can read their own registrations
CREATE POLICY muallimah_select_own ON public.muallimah_registrations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY musyrifah_select_own ON public.musyrifah_registrations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY muallimah_all_admin ON public.muallimah_registrations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

CREATE POLICY musyrifah_all_admin ON public.musyrifah_registrations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- =====================================================
-- CLEANUP DUPLICATE FOREIGN KEY CONSTRAINT
-- =====================================================

-- Drop one of the duplicate FK constraints on users table
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS fk_users_current_tikrar_batch;

-- =====================================================
-- ADD PERFORMANCE INDEXES
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_roles ON public.users USING GIN (roles);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_is_blacklisted ON public.users (is_blacklisted) WHERE is_blacklisted = true;

-- Pendaftaran indexes
CREATE INDEX IF NOT EXISTS idx_pendaftaran_user_batch ON public.pendaftaran_tikrar_tahfidz (user_id, batch_id);
CREATE INDEX IF NOT EXISTS idx_pendaftaran_status ON public.pendaftaran_tikrar_tahfidz (status);
CREATE INDEX IF NOT EXISTS idx_pendaftaran_selection_status ON public.pendaftaran_tikrar_tahfidz (selection_status);

-- Halaqah indexes
CREATE INDEX IF NOT EXISTS idx_halaqah_students_thalibah ON public.halaqah_students (thalibah_id, status);
CREATE INDEX IF NOT EXISTS idx_halaqah_mentors_mentor ON public.halaqah_mentors (mentor_id);

-- Jurnal indexes
CREATE INDEX IF NOT EXISTS idx_jurnal_user_date ON public.jurnal_records (user_id, tanggal_setor DESC NULLS LAST);

-- SP indexes
CREATE INDEX IF NOT EXISTS idx_sp_batch_thalibah ON public.surat_peringatan (batch_id, thalibah_id, status);
CREATE INDEX IF NOT EXISTS idx_sp_active ON public.surat_peringatan (status) WHERE status = 'active';

-- Daftar ulang indexes
CREATE INDEX IF NOT EXISTS idx_daftar_ulang_user_batch ON public.daftar_ulang_submissions (user_id, batch_id);
CREATE INDEX IF NOT EXISTS idx_daftar_ulang_status ON public.daftar_ulang_submissions (status);

-- Exam indexes
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user ON public.exam_attempts (user_id, status);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_registration ON public.exam_attempts (registration_id);

-- Study partners indexes
CREATE INDEX IF NOT EXISTS idx_study_partners_batch ON public.study_partners (batch_id, pairing_status);
CREATE INDEX IF NOT EXISTS idx_study_partners_users ON public.study_partners (user_1_id, user_2_id);
