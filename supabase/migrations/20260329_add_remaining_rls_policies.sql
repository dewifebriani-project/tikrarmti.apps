-- =====================================================
-- REMAINING RLS POLICIES FOR UNPROTECTED TABLES
-- =====================================================
-- This migration completes RLS coverage for all remaining tables.

-- =====================================================
-- ACTIVITY LOGS POLICIES
-- =====================================================

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own activity logs
CREATE POLICY activity_logs_select_own ON public.activity_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all activity logs
CREATE POLICY activity_logs_select_admin ON public.activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- Service role can insert activity logs
CREATE POLICY activity_logs_insert_service ON public.activity_logs
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- BLACKLIST AUDIT LOGS POLICIES
-- =====================================================

ALTER TABLE public.blacklist_audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all blacklist audit logs
CREATE POLICY blacklist_audit_logs_select_admin ON public.blacklist_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- Service role can insert blacklist audit logs
CREATE POLICY blacklist_audit_logs_insert_service ON public.blacklist_audit_logs
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- ERROR LOGS POLICIES
-- =====================================================

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read error logs
CREATE POLICY error_logs_select_admin ON public.error_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- Service role can insert error logs
CREATE POLICY error_logs_insert_service ON public.error_logs
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- EXAM CONFIGURATIONS POLICIES
-- =====================================================

ALTER TABLE public.exam_configurations ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read active exam configurations
CREATE POLICY exam_configurations_select_public ON public.exam_configurations
  FOR SELECT
  USING (is_active = true);

-- Admins can do everything
CREATE POLICY exam_configurations_all_admin ON public.exam_configurations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- =====================================================
-- EXAM QUESTIONS POLICIES
-- =====================================================

ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;

-- Everyone can read active questions (for taking exams)
CREATE POLICY exam_questions_select_active ON public.exam_questions
  FOR SELECT
  USING (is_active = true);

-- Admins can do everything
CREATE POLICY exam_questions_all_admin ON public.exam_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- =====================================================
-- EXAM QUESTION FLAGS POLICIES
-- =====================================================

ALTER TABLE public.exam_question_flags ENABLE ROW LEVEL SECURITY;

-- Users can read their own flags
CREATE POLICY exam_question_flags_select_own ON public.exam_question_flags
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own flags
CREATE POLICY exam_question_flags_insert_own ON public.exam_question_flags
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY exam_question_flags_all_admin ON public.exam_question_flags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- =====================================================
-- HALAQAH CLASS TYPES POLICIES
-- =====================================================

ALTER TABLE public.halaqah_class_types ENABLE ROW LEVEL SECURITY;

-- Public can read active class types
CREATE POLICY halaqah_class_types_select_public ON public.halaqah_class_types
  FOR SELECT
  USING (is_active = true);

-- Admins can do everything
CREATE POLICY halaqah_class_types_all_admin ON public.halaqah_class_types
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- =====================================================
-- HALAQAH MENTORS POLICIES
-- =====================================================

ALTER TABLE public.halaqah_mentors ENABLE ROW LEVEL SECURITY;

-- Public can read mentor assignments
CREATE POLICY halaqah_mentors_select_public ON public.halaqah_mentors
  FOR SELECT
  USING (true);

-- Admins can do everything
CREATE POLICY halaqah_mentors_all_admin ON public.halaqah_mentors
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- =====================================================
-- PARTNER PREFERENCES POLICIES
-- =====================================================

ALTER TABLE public.partner_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read their own partner preferences
CREATE POLICY partner_preferences_select_own ON public.partner_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY partner_preferences_insert_own ON public.partner_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY partner_preferences_update_own ON public.partner_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can read preferences for registrations they're part of
CREATE POLICY partner_preferences_select_registration ON public.partner_preferences
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pendaftaran_tikrar_tahfidz
      WHERE id = registration_id AND user_id = auth.uid()
    )
  );

-- Admins can do everything
CREATE POLICY partner_preferences_all_admin ON public.partner_preferences
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- =====================================================
-- PASSWORD RESET OTPS POLICIES
-- =====================================================

ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;

-- Service role can manage OTPs
CREATE POLICY password_reset_otps_all_service ON public.password_reset_otps
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- SP HISTORY POLICIES
-- =====================================================

ALTER TABLE public.sp_history ENABLE ROW LEVEL SECURITY;

-- Users can read their own SP history
CREATE POLICY sp_history_select_own ON public.sp_history
  FOR SELECT
  USING (auth.uid() = thalibah_id);

-- Admins can do everything
CREATE POLICY sp_history_all_admin ON public.sp_history
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- =====================================================
-- STUDY PARTNERS POLICIES
-- =====================================================

ALTER TABLE public.study_partners ENABLE ROW LEVEL SECURITY;

-- Users can read their own study partnerships
CREATE POLICY study_partners_select_own ON public.study_partners
  FOR SELECT
  USING (auth.uid() = user_1_id OR auth.uid() = user_2_id OR auth.uid() = user_3_id);

-- Admins can do everything
CREATE POLICY study_partners_all_admin ON public.study_partners
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- =====================================================
-- TASHIH RECORDS POLICIES
-- =====================================================

ALTER TABLE public.tashih_records ENABLE ROW LEVEL SECURITY;

-- Users can read their own tashih records
CREATE POLICY tashih_records_select_own ON public.tashih_records
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own records
CREATE POLICY tashih_records_insert_own ON public.tashih_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own records
CREATE POLICY tashih_records_update_own ON public.tashih_records
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can read all records
CREATE POLICY tashih_records_select_admin ON public.tashih_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- =====================================================
-- MAINTENANCE MODE POLICIES
-- =====================================================

ALTER TABLE public.maintenance_mode ENABLE ROW LEVEL SECURITY;

-- Everyone can read maintenance mode status
CREATE POLICY maintenance_mode_select_public ON public.maintenance_mode
  FOR SELECT
  USING (true);

-- Admins can update maintenance mode
CREATE POLICY maintenance_mode_update_admin ON public.maintenance_mode
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY (roles)
    )
  );

-- Service role can manage maintenance mode
CREATE POLICY maintenance_mode_all_service ON public.maintenance_mode
  FOR ALL
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- =====================================================

-- Partner preferences indexes
CREATE INDEX IF NOT EXISTS idx_partner_preferences_user ON public.partner_preferences (user_id);
CREATE INDEX IF NOT EXISTS idx_partner_preferences_registration ON public.partner_preferences (registration_id);
CREATE INDEX IF NOT EXISTS idx_partner_preferences_status ON public.partner_preferences (status);

-- Study partners indexes
CREATE INDEX IF NOT EXISTS idx_study_partners_active ON public.study_partners (pairing_status) WHERE pairing_status = 'active';

-- SP history indexes
CREATE INDEX IF NOT EXISTS idx_sp_history_thalibah ON public.sp_history (thalibah_id, batch_id);

-- Tashih records indexes
CREATE INDEX IF NOT EXISTS idx_tashih_user_date ON public.tashih_records (user_id, waktu_tashih DESC);

-- Exam questions indexes
CREATE INDEX IF NOT EXISTS idx_exam_questions_juz_section ON public.exam_questions (juz_number, section_number);
CREATE INDEX IF NOT EXISTS idx_exam_questions_active ON public.exam_questions (is_active) WHERE is_active = true;

-- Exam configuration indexes
CREATE INDEX IF NOT EXISTS idx_exam_config_active ON public.exam_configurations (is_active) WHERE is_active = true;
