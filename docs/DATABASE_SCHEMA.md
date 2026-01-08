-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activity_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  action character varying NOT NULL,
  resource character varying NOT NULL,
  details jsonb,
  ip_address inet,
  user_agent text,
  timestamp timestamp with time zone DEFAULT now(),
  level character varying NOT NULL CHECK (level::text = ANY (ARRAY['INFO'::character varying::text, 'WARN'::character varying::text, 'ERROR'::character varying::text])),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action character varying NOT NULL,
  entity_type character varying,
  entity_id uuid,
  details jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.batches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  registration_start_date timestamp with time zone,
  registration_end_date timestamp with time zone,
  status character varying DEFAULT 'draft'::character varying CHECK (status::text = ANY (ARRAY['draft'::character varying::text, 'open'::character varying::text, 'closed'::character varying::text, 'archived'::character varying::text])),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  duration_weeks integer NOT NULL DEFAULT 0 CHECK (duration_weeks >= 0),
  is_free boolean DEFAULT true,
  price numeric DEFAULT 0,
  total_quota integer DEFAULT 100,
  program_type character varying DEFAULT NULL::character varying,
  selection_start_date date,
  selection_end_date date,
  selection_result_date date,
  re_enrollment_date date,
  opening_class_date date,
  first_week_start_date date,
  first_week_end_date date,
  review_week_start_date date,
  review_week_end_date date,
  final_exam_start_date date,
  final_exam_end_date date,
  graduation_start_date date,
  graduation_end_date date,
  registered_count integer DEFAULT 0,
  CONSTRAINT batches_pkey PRIMARY KEY (id)
);
CREATE TABLE public.error_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  message text NOT NULL,
  stack text,
  context jsonb,
  timestamp timestamp with time zone DEFAULT now(),
  resolved boolean DEFAULT false,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  CONSTRAINT error_logs_pkey PRIMARY KEY (id),
  CONSTRAINT error_logs_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id)
);
CREATE TABLE public.exam_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  registration_id uuid NOT NULL,
  juz_number integer NOT NULL CHECK (juz_number = ANY (ARRAY[28, 29, 30])),
  started_at timestamp with time zone DEFAULT now(),
  submitted_at timestamp with time zone,
  answers jsonb,
  total_questions integer NOT NULL DEFAULT 100,
  correct_answers integer DEFAULT 0,
  score integer DEFAULT 0,
  status text DEFAULT 'in_progress'::text CHECK (status = ANY (ARRAY['in_progress'::text, 'submitted'::text, 'graded'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  configuration_id uuid,
  attempt_number integer DEFAULT 1,
  time_taken integer,
  passed boolean DEFAULT false,
  is_graded boolean DEFAULT false,
  CONSTRAINT exam_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT exam_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT exam_attempts_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.pendaftaran_tikrar_tahfidz(id),
  CONSTRAINT exam_attempts_configuration_id_fkey FOREIGN KEY (configuration_id) REFERENCES public.exam_configurations(id)
);
CREATE TABLE public.exam_configurations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 30,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  max_attempts integer DEFAULT 1,
  shuffle_questions boolean DEFAULT false,
  randomize_order boolean DEFAULT false,
  show_questions_all boolean DEFAULT true,
  questions_per_attempt integer,
  passing_score integer DEFAULT 70,
  auto_grade boolean DEFAULT true,
  allow_review boolean DEFAULT false,
  show_results boolean DEFAULT true,
  auto_submit_on_timeout boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  score_calculation_mode text DEFAULT 'highest'::text,
  CONSTRAINT exam_configurations_pkey PRIMARY KEY (id),
  CONSTRAINT exam_configurations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.exam_question_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL,
  user_id uuid NOT NULL,
  attempt_id uuid,
  flag_type text NOT NULL CHECK (flag_type = ANY (ARRAY['wrong_answer'::text, 'typo'::text, 'unclear'::text, 'other'::text])),
  flag_message text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'reviewing'::text, 'fixed'::text, 'rejected'::text, 'invalid'::text])),
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT exam_question_flags_pkey PRIMARY KEY (id),
  CONSTRAINT exam_question_flags_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.exam_questions(id),
  CONSTRAINT exam_question_flags_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT exam_question_flags_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.exam_attempts(id),
  CONSTRAINT exam_question_flags_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id)
);
CREATE TABLE public.exam_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  juz_number integer NOT NULL,
  section_number integer NOT NULL CHECK (section_number >= 1 AND section_number <= 9),
  section_title text NOT NULL,
  question_number integer NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type = ANY (ARRAY['multiple_choice'::text, 'introduction'::text])),
  options jsonb,
  correct_answer text,
  points integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  juz_code text,
  CONSTRAINT exam_questions_pkey PRIMARY KEY (id),
  CONSTRAINT exam_questions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.halaqah (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  program_id uuid,  -- Nullable: assigned by admin after halaqah creation
  name character varying NOT NULL,
  description text,
  day_of_week integer CHECK (day_of_week >= 1 AND day_of_week <= 7),
  start_time time without time zone,
  end_time time without time zone,
  location character varying,
  max_students integer DEFAULT 20,
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying::text, 'inactive'::character varying::text, 'suspended'::character varying::text])),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT halaqah_pkey PRIMARY KEY (id),
  CONSTRAINT halaqah_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id)
);
CREATE TABLE public.halaqah_mentors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  halaqah_id uuid NOT NULL,
  mentor_id uuid NOT NULL,
  role character varying NOT NULL CHECK (role::text = ANY (ARRAY['ustadzah'::character varying::text, 'musyrifah'::character varying::text])),
  is_primary boolean DEFAULT false,
  assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT halaqah_mentors_pkey PRIMARY KEY (id),
  CONSTRAINT halaqah_mentors_halaqah_id_fkey FOREIGN KEY (halaqah_id) REFERENCES public.halaqah(id),
  CONSTRAINT halaqah_mentors_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES public.users(id)
);
CREATE TABLE public.halaqah_students (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  halaqah_id uuid NOT NULL,
  thalibah_id uuid NOT NULL,
  assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  assigned_by uuid,
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying::text, 'transferred'::character varying::text, 'graduated'::character varying::text, 'dropped'::character varying::text])),
  CONSTRAINT halaqah_students_pkey PRIMARY KEY (id),
  CONSTRAINT halaqah_students_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id),
  CONSTRAINT halaqah_students_halaqah_id_fkey FOREIGN KEY (halaqah_id) REFERENCES public.halaqah(id),
  CONSTRAINT halaqah_students_thalibah_id_fkey FOREIGN KEY (thalibah_id) REFERENCES public.users(id)
);
CREATE TABLE public.juz_options (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code ~ '^[0-9]+[AB]$'::text),
  name text NOT NULL,
  juz_number integer NOT NULL,
  part text NOT NULL CHECK (part = ANY (ARRAY['A'::text, 'B'::text])),
  start_page integer NOT NULL,
  end_page integer NOT NULL,
  total_pages integer DEFAULT ((end_page - start_page) + 1),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT juz_options_pkey PRIMARY KEY (id)
);
CREATE TABLE public.maintenance_mode (
  id integer NOT NULL DEFAULT nextval('maintenance_mode_id_seq'::regclass),
  is_active boolean DEFAULT false,
  message text DEFAULT 'Website sedang dalam maintenance. Silakan kembali beberapa saat lagi.'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  CONSTRAINT maintenance_mode_pkey PRIMARY KEY (id),
  CONSTRAINT maintenance_mode_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.muallimah_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  full_name text NOT NULL,
  birth_date date NOT NULL,
  birth_place text NOT NULL,
  address text NOT NULL,
  whatsapp text NOT NULL,
  email text NOT NULL,
  education text NOT NULL,
  occupation text NOT NULL,
  memorization_level text NOT NULL,
  memorized_juz text,
  preferred_juz text NOT NULL,
  teaching_experience text NOT NULL,
  teaching_years text,
  teaching_institutions text,
  preferred_schedule text NOT NULL,
  backup_schedule text NOT NULL,
  timezone text NOT NULL DEFAULT 'WIB'::text,
  motivation text,
  special_skills text,
  health_condition text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'review'::text, 'approved'::text, 'rejected'::text, 'waitlist'::text])),
  submitted_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  review_notes text,
  tajweed_institution text,
  quran_institution text,
  teaching_communities text,
  memorized_tajweed_matan text,
  studied_matan_exegesis text,
  examined_juz text,
  certified_juz text,
  paid_class_interest text,
  understands_commitment boolean DEFAULT false,
  age integer,
  class_type text CHECK (class_type = ANY (ARRAY['tashih_ujian'::text, 'tashih_only'::text, 'ujian_only'::text])),
  preferred_max_thalibah integer,
  CONSTRAINT muallimah_registrations_pkey PRIMARY KEY (id),
  CONSTRAINT muallimah_registrations_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id),
  CONSTRAINT muallimah_registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT muallimah_registrations_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id)
);
CREATE TABLE public.musyrifah_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  full_name text NOT NULL,
  birth_date date NOT NULL,
  birth_place text NOT NULL,
  address text NOT NULL,
  whatsapp text NOT NULL,
  email text NOT NULL,
  education text NOT NULL,
  occupation text NOT NULL,
  leadership_experience text NOT NULL,
  leadership_years text,
  leadership_roles text,
  management_skills ARRAY DEFAULT '{}'::text[],
  team_management_experience text NOT NULL,
  preferred_schedule text NOT NULL,
  backup_schedule text NOT NULL,
  timezone text NOT NULL DEFAULT 'WIB'::text,
  motivation text,
  leadership_philosophy text,
  special_achievements text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'review'::text, 'approved'::text, 'rejected'::text, 'waitlist'::text])),
  submitted_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  review_notes text,
  CONSTRAINT musyrifah_registrations_pkey PRIMARY KEY (id),
  CONSTRAINT musyrifah_registrations_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id),
  CONSTRAINT musyrifah_registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT musyrifah_registrations_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id)
);
CREATE TABLE public.pendaftaran_tikrar_tahfidz (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  program_id uuid NOT NULL,
  email character varying,
  full_name character varying NOT NULL,
  address text,
  wa_phone character varying,
  telegram_phone character varying,
  birth_date date,
  age integer,
  domicile character varying,
  timezone character varying DEFAULT 'WIB'::character varying,
  understands_commitment boolean NOT NULL DEFAULT false,
  tried_simulation boolean NOT NULL DEFAULT false,
  no_negotiation boolean NOT NULL DEFAULT false,
  has_telegram boolean NOT NULL DEFAULT false,
  saved_contact boolean NOT NULL DEFAULT false,
  has_permission character varying CHECK (has_permission::text = ANY (ARRAY['yes'::character varying::text, 'janda'::character varying::text, ''::character varying::text])),
  permission_name character varying,
  permission_phone character varying,
  chosen_juz character varying NOT NULL,
  no_travel_plans boolean NOT NULL DEFAULT false,
  motivation text,
  ready_for_team character varying CHECK (ready_for_team::text = ANY (ARRAY['ready'::character varying::text, 'not_ready'::character varying::text, 'considering'::character varying::text, 'infaq'::character varying::text])),
  main_time_slot character varying NOT NULL,
  backup_time_slot character varying NOT NULL,
  time_commitment boolean NOT NULL DEFAULT false,
  understands_program boolean NOT NULL DEFAULT false,
  questions text,
  batch_name character varying NOT NULL,
  submission_date timestamp with time zone DEFAULT now(),
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying::text, 'approved'::character varying::text, 'rejected'::character varying::text, 'withdrawn'::character varying::text])),
  selection_status character varying DEFAULT 'pending'::character varying CHECK (selection_status::text = ANY (ARRAY['pending'::character varying::text, 'selected'::character varying::text, 'not_selected'::character varying::text, 'waitlist'::character varying::text])),
  approved_by uuid,
  approved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  oral_submission_url text,
  oral_submission_file_name text,
  oral_submitted_at timestamp with time zone,
  written_quiz_answers jsonb,
  written_quiz_score integer,
  written_quiz_total_questions integer,
  written_quiz_correct_answers integer,
  written_submitted_at timestamp with time zone,
  written_quiz_submitted_at timestamp with time zone,
  oral_makhraj_errors integer DEFAULT 0,
  oral_sifat_errors integer DEFAULT 0,
  oral_mad_errors integer DEFAULT 0,
  oral_ghunnah_errors integer DEFAULT 0,
  oral_harakat_errors integer DEFAULT 0,
  oral_total_score numeric DEFAULT NULL::numeric,
  oral_assessment_status character varying DEFAULT 'pending'::character varying CHECK (oral_assessment_status::text = ANY (ARRAY['pending'::character varying, 'pass'::character varying, 'fail'::character varying, 'not_submitted'::character varying]::text[])),
  oral_assessed_by uuid,
  oral_assessed_at timestamp with time zone,
  oral_assessment_notes text,
  oral_itmamul_harakat_errors integer DEFAULT 0,
  exam_juz_number integer,
  exam_attempt_id uuid,
  exam_score integer,
  exam_submitted_at timestamp with time zone,
  exam_status text DEFAULT 'not_started'::text CHECK (exam_status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'completed'::text])),
  re_enrollment_completed boolean DEFAULT false,
  re_enrollment_completed_at timestamp with time zone,
  re_enrollment_confirmed_by uuid,
  alasan_mengundurkan_diri text,
  CONSTRAINT pendaftaran_tikrar_tahfidz_pkey PRIMARY KEY (id),
  CONSTRAINT pendaftaran_tikrar_tahfidz_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id),
  CONSTRAINT pendaftaran_tikrar_tahfidz_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id),
  CONSTRAINT pendaftaran_tikrar_tahfidz_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id),
  CONSTRAINT pendaftaran_tikrar_tahfidz_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT pendaftaran_tikrar_tahfidz_oral_assessed_by_fkey FOREIGN KEY (oral_assessed_by) REFERENCES public.users(id),
  CONSTRAINT pendaftaran_tikrar_tahfidz_exam_attempt_fkey FOREIGN KEY (exam_attempt_id) REFERENCES public.exam_attempts(id),
  CONSTRAINT pendaftaran_tikrar_tahfidz_re_enrollment_confirmed_by_fkey FOREIGN KEY (re_enrollment_confirmed_by) REFERENCES public.users(id)
);
CREATE TABLE public.presensi (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  halaqah_id uuid NOT NULL,
  thalibah_id uuid NOT NULL,
  date date NOT NULL,
  status character varying NOT NULL CHECK (status::text = ANY (ARRAY['hadir'::character varying::text, 'izin'::character varying::text, 'sakit'::character varying::text, 'alpha'::character varying::text])),
  notes text,
  recorded_by uuid,
  recorded_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT presensi_pkey PRIMARY KEY (id),
  CONSTRAINT presensi_halaqah_id_fkey FOREIGN KEY (halaqah_id) REFERENCES public.halaqah(id),
  CONSTRAINT presensi_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.users(id),
  CONSTRAINT presensi_thalibah_id_fkey FOREIGN KEY (thalibah_id) REFERENCES public.users(id)
);
CREATE TABLE public.programs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL,
  name character varying NOT NULL,
  description text,
  target_level character varying,
  duration_weeks integer,
  max_thalibah integer,
  status character varying DEFAULT 'draft'::character varying CHECK (status::text = ANY (ARRAY['draft'::character varying::text, 'open'::character varying::text, 'ongoing'::character varying::text, 'completed'::character varying::text, 'cancelled'::character varying::text])),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT programs_pkey PRIMARY KEY (id),
  CONSTRAINT programs_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL UNIQUE,
  password_hash character varying,
  full_name character varying,
  role character varying,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  provinsi text,
  kota text,
  alamat text,
  whatsapp text,
  telegram text,
  zona_waktu text,
  tanggal_lahir date NOT NULL,
  tempat_lahir text NOT NULL,
  pekerjaan text NOT NULL,
  alasan_daftar text NOT NULL,
  jenis_kelamin character varying NOT NULL CHECK ((jenis_kelamin::text = ANY (ARRAY['Perempuan'::character varying::text, 'Laki-laki'::character varying::text])) OR jenis_kelamin IS NULL),
  negara character varying NOT NULL,
  nama_kunyah text,
  roles ARRAY CHECK (roles <@ ARRAY['admin'::text, 'calon_thalibah'::text, 'thalibah'::text, 'muallimah'::text, 'musyrifah'::text, 'pengurus'::text]),
  current_tikrar_batch_id uuid,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT fk_users_current_tikrar_batch FOREIGN KEY (current_tikrar_batch_id) REFERENCES public.batches(id),
  CONSTRAINT users_current_tikrar_batch_id_fkey FOREIGN KEY (current_tikrar_batch_id) REFERENCES public.batches(id)
);
-- ============================================================================
-- DAFTAR ULANG SYSTEM TABLES (Added 2026-01-08)
-- ============================================================================

CREATE TABLE public.daftar_ulang_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  registration_id uuid NOT NULL REFERENCES public.pendaftaran_tikrar_tahfidz(id) ON DELETE CASCADE,
  batch_id uuid NOT NULL REFERENCES public.batches(id),

  -- Confirmed data from registration
  confirmed_full_name character varying NOT NULL,
  confirmed_chosen_juz character varying NOT NULL,
  confirmed_main_time_slot character varying NOT NULL,
  confirmed_backup_time_slot character varying NOT NULL,
  confirmed_wa_phone character varying,
  confirmed_address text,

  -- Partner selection
  partner_type character varying NOT NULL CHECK (partner_type::text = ANY (ARRAY['self_match'::character varying::text, 'system_match'::character varying::text, 'family'::character varying::text, 'tarteel'::character varying::text])),
  partner_user_id uuid REFERENCES public.users(id),
  partner_name character varying,
  partner_relationship character varying,
  partner_notes text,

  -- Halaqah selection
  ujian_halaqah_id uuid REFERENCES public.halaqah(id),
  tashih_halaqah_id uuid REFERENCES public.halaqah(id),
  is_tashih_umum boolean DEFAULT false,

  -- Akad submission
  akad_url text,
  akad_file_name character varying,
  akad_submitted_at timestamp with time zone,

  -- Status tracking
  status character varying NOT NULL DEFAULT 'draft'::character varying CHECK (status::text = ANY (ARRAY['draft'::character varying::text, 'submitted'::character varying::text, 'approved'::character varying::text, 'rejected'::character varying::text])),
  submitted_at timestamp with time zone,
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES public.users(id),
  review_notes text,

  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daftar_ulang_submissions_user_id_key UNIQUE (user_id, registration_id)
);

CREATE TABLE public.partner_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  preferred_partner_id uuid REFERENCES public.users(id),
  registration_id uuid NOT NULL REFERENCES public.pendaftaran_tikrar_tahfidz(id),
  status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying::text, 'accepted'::character varying::text, 'rejected'::character varying::text, 'cancelled'::character varying::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT partner_preferences_user_partner_unique UNIQUE (user_id, preferred_partner_id, registration_id)
);

CREATE TABLE public.halaqah_class_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  halaqah_id uuid NOT NULL REFERENCES public.halaqah(id) ON DELETE CASCADE,
  class_type character varying NOT NULL CHECK (class_type::text = ANY (ARRAY['tashih_ujian'::character varying::text, 'tashih_only'::character varying::text, 'ujian_only'::character varying::text])),
  current_students integer DEFAULT 0,
  max_students integer DEFAULT 20,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT halaqah_class_types_halaqah_type_unique UNIQUE (halaqah_id, class_type)
);

-- ============================================================================
-- FUNCTIONS (Added 2026-01-08)
-- ============================================================================

-- Function: find_compatible_study_partners
-- Returns compatible study partners with priority: zona_waktu first, then juz option > juz number > cross juz
-- Each category: main_time_slot > backup_time_slot
CREATE OR REPLACE FUNCTION find_compatible_study_partners(
  p_user_id uuid,
  p_batch_id uuid,
  p_time_slot character varying,
  p_juz character varying,
  p_zona_waktu character varying
) RETURNS TABLE (
  partner_id uuid,
  partner_name character varying,
  partner_juz character varying,
  partner_juz_option character varying,
  partner_juz_number integer,
  partner_time_slot character varying,
  partner_backup_time_slot character varying,
  partner_zona_waktu character varying,
  match_score integer,
  match_details character varying
) LANGUAGE plpgsql SECURITY DEFINER;

-- Function: analyze_potential_matches
-- Analyzes potential matching opportunities for all selected thalibah in a batch
CREATE OR REPLACE FUNCTION analyze_potential_matches(p_batch_id uuid)
RETURNS TABLE (
  user_id uuid,
  user_name character varying,
  user_juz character varying,
  user_juz_number integer,
  user_zona_waktu character varying,
  user_main_time character varying,
  user_backup_time character varying,
  total_matches integer,
  zona_waktu_matches integer,
  same_juz_matches integer,
  cross_juz_matches integer
) LANGUAGE plpgsql SECURITY DEFINER;

-- Function: analyze_halaqah_availability_by_juz
-- Analyzes halaqah availability by juz option for a given batch
CREATE OR REPLACE FUNCTION analyze_halaqah_availability_by_juz(p_batch_id uuid)
RETURNS TABLE (
  juz_code character varying,
  juz_number integer,
  juz_name character varying,
  total_thalibah integer,
  available_halaqah integer,
  halaqah_details jsonb
) LANGUAGE plpgsql SECURITY DEFINER;

