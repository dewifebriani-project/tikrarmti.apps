-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

-- ============================================================================
-- SQL UPDATE STATEMENTS FOR MUALLIMAH REGISTRATION CHANGES
-- ============================================================================
-- Run these SQL statements to update the muallimah_registrations table
-- for the new form structure:
--
-- 1. Remove memorization_level field (no longer needed)
-- 2. Add class_type field for class type selection
-- 3. Add preferred_max_thalibah field for max students per class
-- 4. Update timezone to always use WIB as default
--
-- Execute with: psql -U postgres -d your_database -f muallimah_schema_update.sql
-- ============================================================================

-- Add new columns to muallimah_registrations table
ALTER TABLE public.muallimah_registrations
  ADD COLUMN IF NOT EXISTS class_type text CHECK (class_type = ANY (ARRAY['tashih_ujian'::text, 'tashih_only'::text, 'ujian_only'::text]));

ALTER TABLE public.muallimah_registrations
  ADD COLUMN IF NOT EXISTS preferred_max_thalibah integer;

-- Set default class_type for existing records
UPDATE public.muallimah_registrations
SET class_type = 'tashih_ujian'
WHERE class_type IS NULL;

-- Make class_type nullable for now (optional, can be set to NOT NULL later)
-- ALTER TABLE public.muallimah_registrations
--   ALTER COLUMN class_type SET NOT NULL;

-- Note: memorization_level is kept for backward compatibility but no longer used in the form
-- Note: timezone already has 'WIB' as default, no changes needed

-- Paid class schedule format has changed from checkbox days (array) to single day (radio button)
-- The paid_class_interest JSONB field now stores:
-- {
--   name: string,
--   schedule1: { day: string, time_start: string, time_end: string } | null,
--   schedule2: { day: string, time_start: string, time_end: string } | null,
--   max_students: number | null,
--   spp_percentage: string | null,
--   additional_info: string | null
-- }

-- ============================================================================

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
CREATE TABLE public.halaqah (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL,
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
  CONSTRAINT muallimah_registrations_pkey PRIMARY KEY (id),
  CONSTRAINT muallimah_registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT muallimah_registrations_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id),
  CONSTRAINT muallimah_registrations_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id)
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
  CONSTRAINT musyrifah_registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT musyrifah_registrations_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id),
  CONSTRAINT musyrifah_registrations_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id)
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
  CONSTRAINT pendaftaran_tikrar_tahfidz_pkey PRIMARY KEY (id),
  CONSTRAINT pendaftaran_tikrar_tahfidz_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id),
  CONSTRAINT pendaftaran_tikrar_tahfidz_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id),
  CONSTRAINT pendaftaran_tikrar_tahfidz_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id),
  CONSTRAINT pendaftaran_tikrar_tahfidz_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
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
  CONSTRAINT users_pkey PRIMARY KEY (id)
);