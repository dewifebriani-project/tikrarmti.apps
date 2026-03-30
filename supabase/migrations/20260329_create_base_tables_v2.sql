-- ============================================================================
-- CREATE BASE TABLES FOR TIKRARMTI APPS (STEP 1)
-- ============================================================================
-- This migration creates all base tables that DON'T depend on pendaftaran_tikrar_tahfidz
--
-- Order: batches -> programs -> halaqah -> others (exclude exam_attempts for now)
--
-- Author: Generated as part of security audit fixes
-- Date: 2026-03-29
-- ============================================================================

-- ============================================================================
-- BATCHES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.batches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  registration_start_date timestamp with time zone,
  registration_end_date timestamp with time zone,
  status character varying DEFAULT 'draft'::character varying NOT NULL CHECK (status::text = ANY (ARRAY['draft'::character varying::text, 'open'::character varying::text, 'closed'::character varying::text, 'archived'::character varying::text])),
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

-- Create indexes for batches
CREATE INDEX IF NOT EXISTS idx_batches_status ON public.batches USING btree (status);
CREATE INDEX IF NOT EXISTS idx_batches_dates ON public.batches USING btree (start_date, end_date);

-- ============================================================================
-- PROGRAMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.programs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL,
  name character varying NOT NULL,
  description text,
  target_level character varying,
  duration_weeks integer,
  max_thalibah integer,
  status character varying DEFAULT 'draft'::character varying NOT NULL CHECK (status::text = ANY (ARRAY['draft'::character varying::text, 'open'::character varying::text, 'ongoing'::character varying::text, 'completed'::character varying::text, 'cancelled'::character varying::text])),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  class_type text CHECK (class_type IS NULL OR (class_type = ANY (ARRAY['tikrar_tahfidz'::text, 'pra_tahfidz'::text, 'tashih_only'::text, 'ujian_only'::text, 'tashih_ujian'::text]))),
  CONSTRAINT programs_pkey PRIMARY KEY (id),
  CONSTRAINT programs_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id) ON DELETE CASCADE
);

-- Create indexes for programs
CREATE INDEX IF NOT EXISTS idx_programs_batch_id ON public.programs USING btree (batch_id);
CREATE INDEX IF NOT EXISTS idx_programs_status ON public.programs USING btree (status);

-- ============================================================================
-- HALAQAH TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.halaqah (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  program_id uuid,
  name character varying NOT NULL,
  description text,
  day_of_week integer CHECK (day_of_week >= 1 AND day_of_week <= 7),
  start_time time without time zone,
  end_time time without time zone,
  location character varying,
  max_students integer DEFAULT 20,
  status character varying DEFAULT 'active'::character varying NOT NULL CHECK (status::text = ANY (ARRAY['active'::character varying::text, 'inactive'::character varying::text, 'suspended'::character varying::text])),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  zoom_link text,
  muallimah_id uuid,
  waitlist_max integer DEFAULT 5,
  preferred_juz text,
  CONSTRAINT halaqah_pkey PRIMARY KEY (id),
  CONSTRAINT halaqah_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE SET NULL,
  CONSTRAINT halaqah_muallimah_id_fkey FOREIGN KEY (muallimah_id) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Create indexes for halaqah
CREATE INDEX IF NOT EXISTS idx_halaqah_program_id ON public.halaqah USING btree (program_id);
CREATE INDEX IF NOT EXISTS idx_halaqah_status ON public.halaqah USING btree (status);

-- ============================================================================
-- HALAQAH_MENTORS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.halaqah_mentors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  halaqah_id uuid NOT NULL,
  mentor_id uuid NOT NULL,
  role character varying NOT NULL CHECK (role::text = ANY (ARRAY['ustadzah'::character varying::text, 'musyrifah'::character varying::text])),
  is_primary boolean DEFAULT false,
  assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT halaqah_mentors_pkey PRIMARY KEY (id),
  CONSTRAINT halaqah_mentors_halaqah_id_fkey FOREIGN KEY (halaqah_id) REFERENCES public.halaqah(id) ON DELETE CASCADE,
  CONSTRAINT halaqah_mentors_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create indexes for halaqah_mentors
CREATE INDEX IF NOT EXISTS idx_halaqah_mentors_halaqah_id ON public.halaqah_mentors USING btree (halaqah_id);
CREATE INDEX IF NOT EXISTS idx_halaqah_mentors_mentor_id ON public.halaqah_mentors USING btree (mentor_id);

-- ============================================================================
-- HALAQAH_STUDENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.halaqah_students (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  halaqah_id uuid NOT NULL,
  thalibah_id uuid NOT NULL,
  assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  assigned_by uuid,
  status character varying DEFAULT 'active'::character varying NOT NULL CHECK (status::text = ANY (ARRAY['active'::character varying::text, 'transferred'::character varying::text, 'graduated'::character varying::text, 'dropped'::character varying::text])),
  CONSTRAINT halaqah_students_pkey PRIMARY KEY (id),
  CONSTRAINT halaqah_students_halaqah_id_fkey FOREIGN KEY (halaqah_id) REFERENCES public.halaqah(id) ON DELETE CASCADE,
  CONSTRAINT halaqah_students_thalibah_id_fkey FOREIGN KEY (thalibah_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT halaqah_students_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Create indexes for halaqah_students
CREATE INDEX IF NOT EXISTS idx_halaqah_students_halaqah_id ON public.halaqah_students USING btree (halaqah_id);
CREATE INDEX IF NOT EXISTS idx_halaqah_students_thalibah_id ON public.halaqah_students USING btree (thalibah_id);

-- ============================================================================
-- JURNAL_RECORDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.jurnal_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tanggal_jurnal timestamp with time zone NOT NULL DEFAULT now(),
  tashih_completed boolean DEFAULT false,
  rabth_completed boolean DEFAULT false,
  murajaah_count integer DEFAULT 0 CHECK (murajaah_count >= 0),
  simak_murattal_count integer DEFAULT 0 CHECK (simak_murattal_count >= 0),
  tikrar_bi_an_nadzar_completed boolean DEFAULT false,
  tasmi_record_count integer DEFAULT 0 CHECK (tasmi_record_count >= 0),
  simak_record_completed boolean DEFAULT false,
  tikrar_bi_al_ghaib_count integer DEFAULT 0 CHECK (tikrar_bi_al_ghaib_count >= 0),
  tafsir_completed boolean DEFAULT false,
  menulis_completed boolean DEFAULT false,
  total_duration_minutes integer DEFAULT 0 CHECK (total_duration_minutes >= 0),
  catatan_tambahan text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  tanggal_setor date NOT NULL DEFAULT CURRENT_DATE,
  juz_code character varying,
  blok character varying,
  tikrar_bi_al_ghaib_type character varying CHECK (tikrar_bi_al_ghaib_type IS NULL OR tikrar_bi_al_ghaib_type::text = ''::text OR (tikrar_bi_al_ghaib_type::text = ANY (ARRAY['pasangan_40'::character varying, 'keluarga_40'::character varying, 'tarteel_40'::character varying, 'pasangan_40_wa'::character varying, 'pasangan_20_wa'::character varying, 'voice_note_20'::character varying, 'pasangan_20'::character varying, 'keluarga_40_suami'::character varying, 'keluarga_40_ayah'::character varying, 'keluarga_40_ibu'::character varying, 'keluarga_40_kakak'::character varying, 'keluarga_40_adik'::character varying, 'keluarga_40_saudara'::character varying]::text[]))),
  tikrar_bi_al_ghaib_40x text[] CHECK (tikrar_bi_al_ghaib_40x IS NULL OR array_length(tikrar_bi_al_ghaib_40x, 1) IS NULL OR tikrar_bi_al_ghaib_40x <@ ARRAY['pasangan_40'::text, 'pasangan_40_wa'::text, 'keluarga_40'::text, 'keluarga_40_suami'::text, 'keluarga_40_ayah'::text, 'keluarga_40_ibu'::text, 'keluarga_40_kakak'::text, 'keluarga_40_adik'::text, 'keluarga_40_saudara'::text, 'tarteel_40'::text]),
  tikrar_bi_al_ghaib_20x text[] CHECK (tikrar_bi_al_ghaib_20x IS NULL OR array_length(tikrar_bi_al_ghaib_20x, 1) IS NULL OR tikrar_bi_al_ghaib_20x <@ ARRAY['pasangan_20'::text, 'pasangan_20_wa'::text, 'voice_note_20'::text]),
  tarteel_screenshot_url text,
  CONSTRAINT jurnal_records_pkey PRIMARY KEY (id),
  CONSTRAINT jurnal_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create indexes for jurnal_records
CREATE INDEX IF NOT EXISTS idx_jurnal_records_user_id ON public.jurnal_records USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_jurnal_records_tanggal_setor ON public.jurnal_records USING btree (tanggal_setor);

-- Enable RLS on jurnal_records
ALTER TABLE jurnal_records ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TASHIH_RECORDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tashih_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  blok character varying NOT NULL,
  lokasi character varying NOT NULL,
  lokasi_detail text,
  nama_pemeriksa character varying,
  masalah_tajwid jsonb DEFAULT '[]'::jsonb,
  catatan_tambahan text,
  waktu_tashih timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  ustadzah_id uuid,
  jumlah_kesalahan_tajwid integer DEFAULT 0,
  CONSTRAINT tashih_records_pkey PRIMARY KEY (id),
  CONSTRAINT tashih_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT tashih_records_ustadzah_id_fkey FOREIGN KEY (ustadzah_id) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Create indexes for tashih_records
CREATE INDEX IF NOT EXISTS idx_tashih_records_user_id ON public.tashih_records USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_tashih_records_blok ON public.tashih_records USING btree (blok);

-- Enable RLS on tashih_records
ALTER TABLE tashih_records ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- MUALLIMAH_REGISTRATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.muallimah_registrations (
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
  CONSTRAINT muallimah_registrations_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id) ON DELETE CASCADE,
  CONSTRAINT muallimah_registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT muallimah_registrations_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Create indexes for muallimah_registrations
CREATE INDEX IF NOT EXISTS idx_muallimah_registrations_user_id ON public.muallimah_registrations USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_muallimah_registrations_batch_id ON public.muallimah_registrations USING btree (batch_id);
CREATE INDEX IF NOT EXISTS idx_muallimah_registrations_status ON public.muallimah_registrations USING btree (status);

-- Enable RLS on muallimah_registrations
ALTER TABLE muallimah_registrations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- MUSYRIFAH_REGISTRATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.musyrifah_registrations (
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
  management_skills text[] DEFAULT '{}',
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
  CONSTRAINT musyrifah_registrations_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id) ON DELETE CASCADE,
  CONSTRAINT musyrifah_registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT musyrifah_registrations_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Create indexes for musyrifah_registrations
CREATE INDEX IF NOT EXISTS idx_musyrifah_registrations_user_id ON public.musyrifah_registrations USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_musyrifah_registrations_batch_id ON public.musyrifah_registrations USING btree (batch_id);
CREATE INDEX IF NOT EXISTS idx_musyrifah_registrations_status ON public.musyrifah_registrations USING btree (status);

-- Enable RLS on musyrifah_registrations
ALTER TABLE musyrifah_registrations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SYSTEM_LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.system_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  error_message text NOT NULL,
  error_name text,
  error_stack text,
  context jsonb DEFAULT '{}'::jsonb,
  user_id uuid,
  user_email text,
  user_role text[],
  request_path text,
  request_method text,
  ip_address text,
  user_agent text,
  severity text DEFAULT 'ERROR'::text CHECK (severity = ANY (ARRAY['DEBUG'::text, 'INFO'::text, 'WARN'::text, 'ERROR'::text, 'FATAL'::text])),
  error_type text DEFAULT 'runtime'::text CHECK (error_type = ANY (ARRAY['runtime'::text, 'auth'::text, 'database'::text, 'validation'::text, 'network'::text, 'unknown'::text])),
  is_auth_error boolean DEFAULT false,
  is_supabase_getuser_error boolean DEFAULT false,
  environment text DEFAULT 'development'::text,
  release_version text,
  tags text[] DEFAULT '{}',
  sentry_event_id text,
  sentry_sent boolean DEFAULT false,
  CONSTRAINT system_logs_pkey PRIMARY KEY (id),
  CONSTRAINT system_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for system_logs
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON public.system_logs USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_severity ON public.system_logs USING btree (severity);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs USING btree (created_at);

-- Enable RLS on system_logs
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- AUDIT_LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action character varying NOT NULL,
  entity_type character varying,
  entity_id uuid,
  details jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs USING btree (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ACTIVITY_LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.activity_logs (
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
  CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON public.activity_logs USING btree (timestamp);

-- Enable RLS on activity_logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ERROR_LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.error_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  message text NOT NULL,
  stack text,
  context jsonb,
  timestamp timestamp with time zone DEFAULT now(),
  resolved boolean DEFAULT false,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  CONSTRAINT error_logs_pkey PRIMARY KEY (id),
  CONSTRAINT error_logs_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for error_logs
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON public.error_logs USING btree (timestamp);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON public.error_logs USING btree (resolved);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.batches IS 'Batch program Tikrar MTI';
COMMENT ON TABLE public.programs IS 'Program dalam setiap batch';
COMMENT ON TABLE public.halaqah IS 'Kelompok belajar (halaqah)';
COMMENT ON TABLE public.jurnal_records IS 'Jurnal harian thalibah';
COMMENT ON TABLE public.tashih_records IS 'Rekor tashih/corrector bacaan';
COMMENT ON TABLE public.muallimah_registrations IS 'Pendaftaran muallimah';
COMMENT ON TABLE public.musyrifah_registrations IS 'Pendaftaran musyrifah';
