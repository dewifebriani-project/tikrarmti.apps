-- =====================================================
-- SETUP SCEMA - TIKRAR MTI APPS (SIMPLIFIED VERSION)
-- Jalankan di PROJECT BARU: https://lhqbqzrghdbbmstnhple.supabase.co
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. users
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email character varying NOT NULL UNIQUE,
  password_hash character varying,
  full_name character varying,
  role character varying,
  avatar_url text,
  is_active boolean DEFAULT true,
  is_blacklisted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  provinsi text,
  kota text,
  alamat text,
  whatsapp text,
  telegram text,
  zona_waktu text DEFAULT 'WIB',
  tanggal_lahir date,
  tempat_lahir text,
  pekerjaan text,
  alasan_daftar text,
  jenis_kelamin character varying,
  negara character varying,
  nama_kunyah text,
  roles text[],
  current_tikrar_batch_id uuid
);

-- 2. batches
CREATE TABLE IF NOT EXISTS public.batches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name character varying NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  registration_start_date timestamp with time zone,
  registration_end_date timestamp with time zone,
  status character varying DEFAULT 'draft',
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  duration_weeks integer NOT NULL DEFAULT 0,
  is_free boolean DEFAULT true,
  price numeric DEFAULT 0,
  total_quota integer DEFAULT 100,
  program_type character varying,
  selection_start_date date,
  selection_end_date date,
  selection_result_date date,
  re_enrollment_date date,
  registered_count integer DEFAULT 0
);

-- 3. programs
CREATE TABLE IF NOT EXISTS public.programs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id uuid NOT NULL,
  name character varying NOT NULL,
  description text,
  target_level character varying,
  duration_weeks integer,
  max_thalibah integer,
  status character varying DEFAULT 'draft',
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  class_type text
);

-- 4. juz_options
CREATE TABLE IF NOT EXISTS public.juz_options (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  juz_number integer NOT NULL,
  part text NOT NULL,
  start_page integer NOT NULL,
  end_page integer NOT NULL,
  total_pages integer,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 5. halaqah
CREATE TABLE IF NOT EXISTS public.halaqah (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id uuid,
  name character varying NOT NULL,
  description text,
  day_of_week integer,
  start_time time without time zone,
  end_time time without time zone,
  location character varying,
  max_students integer DEFAULT 20,
  status character varying DEFAULT 'active',
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  zoom_link text,
  muallimah_id uuid,
  waitlist_max integer DEFAULT 5,
  preferred_juz text
);

-- 6. halaqah_students
CREATE TABLE IF NOT EXISTS public.halaqah_students (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  halaqah_id uuid NOT NULL,
  thalibah_id uuid NOT NULL,
  assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  assigned_by uuid,
  status character varying DEFAULT 'active'
);

-- 7. halaqah_mentors
CREATE TABLE IF NOT EXISTS public.halaqah_mentors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  halaqah_id uuid NOT NULL,
  mentor_id uuid NOT NULL,
  role character varying NOT NULL,
  is_primary boolean DEFAULT false,
  assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- 8. pendaftaran_tikrar_tahfidz
CREATE TABLE IF NOT EXISTS public.pendaftaran_tikrar_tahfidz (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  program_id uuid NOT NULL,
  email character varying,
  full_name character varying NOT NULL,
  address text,
  wa_phone character varying,
  telegram_phone character varying,
  chosen_juz character varying NOT NULL,
  main_time_slot character varying NOT NULL,
  backup_time_slot character varying NOT NULL,
  status character varying DEFAULT 'pending',
  selection_status character varying DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  submission_date timestamp with time zone DEFAULT now()
);

-- 9. daftar_ulang_submissions
CREATE TABLE IF NOT EXISTS public.daftar_ulang_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  registration_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  confirmed_full_name character varying NOT NULL,
  confirmed_chosen_juz character varying NOT NULL,
  confirmed_main_time_slot character varying NOT NULL,
  confirmed_backup_time_slot character varying NOT NULL,
  status character varying NOT NULL DEFAULT 'draft',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 10. jurnal_records
CREATE TABLE IF NOT EXISTS public.jurnal_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  tanggal_jurnal timestamp with time zone NOT NULL DEFAULT now(),
  tanggal_setor date NOT NULL DEFAULT CURRENT_DATE,
  tashih_completed boolean DEFAULT false,
  murajaah_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 11. tashih_records
CREATE TABLE IF NOT EXISTS public.tashih_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  blok character varying NOT NULL,
  lokasi character varying NOT NULL,
  masalah_tajwid jsonb DEFAULT '[]'::jsonb,
  waktu_tashih timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 12. muallimah_registrations
CREATE TABLE IF NOT EXISTS public.muallimah_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  full_name text NOT NULL,
  whatsapp text NOT NULL,
  email text NOT NULL,
  preferred_juz text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now()
);

-- 13. musyrifah_registrations
CREATE TABLE IF NOT EXISTS public.musyrifah_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  full_name text NOT NULL,
  whatsapp text NOT NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now()
);

-- 14. exam_configurations
CREATE TABLE IF NOT EXISTS public.exam_configurations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 15. exam_questions
CREATE TABLE IF NOT EXISTS public.exam_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  juz_number integer NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL,
  options jsonb,
  correct_answer text,
  points integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 16. exam_attempts
CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  registration_id uuid NOT NULL,
  juz_number integer NOT NULL,
  started_at timestamp with time zone DEFAULT now(),
  submitted_at timestamp with time zone,
  answers jsonb,
  total_questions integer NOT NULL DEFAULT 100,
  score integer DEFAULT 0,
  status text DEFAULT 'in_progress',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 17. audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  action character varying NOT NULL,
  entity_type character varying,
  entity_id uuid,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- BAH 2: Add Foreign Keys
-- =====================================================

ALTER TABLE public.programs ADD CONSTRAINT fk_programs_batch
  FOREIGN KEY (batch_id) REFERENCES public.batches(id);

ALTER TABLE public.halaqah ADD CONSTRAINT fk_halaqah_program
  FOREIGN KEY (program_id) REFERENCES public.programs(id);
ALTER TABLE public.halaqah ADD CONSTRAINT fk_halaqah_muallimah
  FOREIGN KEY (muallimah_id) REFERENCES public.users(id);

ALTER TABLE public.halaqah_students ADD CONSTRAINT fk_halaqah_students_halaqah
  FOREIGN KEY (halaqah_id) REFERENCES public.halaqah(id);
ALTER TABLE public.halaqah_students ADD CONSTRAINT fk_halaqah_students_thalibah
  FOREIGN KEY (thalibah_id) REFERENCES public.users(id);
ALTER TABLE public.halaqah_students ADD CONSTRAINT fk_halaqah_students_assigned_by
  FOREIGN KEY (assigned_by) REFERENCES public.users(id);

ALTER TABLE public.halaqah_mentors ADD CONSTRAINT fk_halaqah_mentors_halaqah
  FOREIGN KEY (halaqah_id) REFERENCES public.halaqah(id);
ALTER TABLE public.halaqah_mentors ADD CONSTRAINT fk_halaqah_mentors_mentor
  FOREIGN KEY (mentor_id) REFERENCES public.users(id);

ALTER TABLE public.pendaftaran_tikrar_tahfidz ADD CONSTRAINT fk_pendaftaran_user
  FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.pendaftaran_tikrar_tahfidz ADD CONSTRAINT fk_pendaftaran_batch
  FOREIGN KEY (batch_id) REFERENCES public.batches(id);
ALTER TABLE public.pendaftaran_tikrar_tahfidz ADD CONSTRAINT fk_pendaftaran_program
  FOREIGN KEY (program_id) REFERENCES public.programs(id);

ALTER TABLE public.daftar_ulang_submissions ADD CONSTRAINT fk_daftar_ulang_user
  FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.daftar_ulang_submissions ADD CONSTRAINT fk_daftar_ulang_registration
  FOREIGN KEY (registration_id) REFERENCES public.pendaftaran_tikrar_tahfidz(id);
ALTER TABLE public.daftar_ulang_submissions ADD CONSTRAINT fk_daftar_ulang_batch
  FOREIGN KEY (batch_id) REFERENCES public.batches(id);

ALTER TABLE public.jurnal_records ADD CONSTRAINT fk_jurnal_user
  FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE public.tashih_records ADD CONSTRAINT fk_tashih_user
  FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE public.muallimah_registrations ADD CONSTRAINT fk_muallimah_user
  FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.muallimah_registrations ADD CONSTRAINT fk_muallimah_batch
  FOREIGN KEY (batch_id) REFERENCES public.batches(id);

ALTER TABLE public.musyrifah_registrations ADD CONSTRAINT fk_musyrifah_user
  FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.musyrifah_registrations ADD CONSTRAINT fk_musyrifah_batch
  FOREIGN KEY (batch_id) REFERENCES public.batches(id);

ALTER TABLE public.exam_attempts ADD CONSTRAINT fk_exam_attempts_user
  FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.exam_attempts ADD CONSTRAINT fk_exam_attempts_registration
  FOREIGN KEY (registration_id) REFERENCES public.pendaftaran_tikrar_tahfidz(id);

ALTER TABLE public.audit_logs ADD CONSTRAINT fk_audit_logs_user
  FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE public.users ADD CONSTRAINT fk_users_current_batch
  FOREIGN KEY (current_tikrar_batch_id) REFERENCES public.batches(id);

-- =====================================================
-- VERIFIKASI
-- =====================================================

SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
