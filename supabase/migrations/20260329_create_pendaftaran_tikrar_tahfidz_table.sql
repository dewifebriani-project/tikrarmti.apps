-- ============================================================================
-- CREATE PENDAFTARAN_TIKRAR_TAHFIDZ TABLE
-- ============================================================================
-- This migration creates the pendaftaran_tikrar_tahfidz table with all
-- necessary columns, indexes, constraints, and triggers.
--
-- Author: Generated as part of security audit fixes
-- Date: 2026-03-29
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTIONS FOR TRIGGERS
-- ============================================================================

-- Function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_pendaftaran_tikrar_tahfidz_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle re-enrollment completion
CREATE OR REPLACE FUNCTION public.handle_re_enrollment_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when re-enrollment is completed
  IF NEW.re_enrollment_completed = true AND (OLD.re_enrollment_completed IS NULL OR OLD.re_enrollment_completed = false) THEN
    NEW.re_enrollment_completed_at = NOW();
    NEW.re_enrollment_confirmed_by = auth.uid();

    -- Update user's current_tikrar_batch_id
    UPDATE public.users
    SET current_tikrar_batch_id = NEW.batch_id
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to set user's current tikrar batch
CREATE OR REPLACE FUNCTION public.set_user_current_tikrar_batch()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if status is 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Update user's current_tikrar_batch_id
    UPDATE public.users
    SET current_tikrar_batch_id = NEW.batch_id
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE TABLE
-- ============================================================================

create table public.pendaftaran_tikrar_tahfidz (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  batch_id uuid not null,
  program_id uuid not null,
  email character varying(255) null,
  full_name character varying(255) not null,
  address text null,
  wa_phone character varying(20) null,
  telegram_phone character varying(20) null,
  birth_date date null,
  age integer null,
  domicile character varying(255) null,
  timezone character varying(50) null default 'WIB'::character varying,
  understands_commitment boolean not null default false,
  tried_simulation boolean not null default false,
  no_negotiation boolean not null default false,
  has_telegram boolean not null default false,
  saved_contact boolean not null default false,
  has_permission character varying(10) null,
  permission_name character varying(255) null,
  permission_phone character varying(20) null,
  chosen_juz character varying(10) not null,
  no_travel_plans boolean not null default false,
  motivation text null,
  ready_for_team character varying(20) null,
  main_time_slot character varying(20) not null,
  backup_time_slot character varying(20) not null,
  time_commitment boolean not null default false,
  understands_program boolean not null default false,
  questions text null,
  batch_name character varying(100) not null,
  submission_date timestamp with time zone null default now(),
  status character varying(20) null default 'pending'::character varying,
  selection_status character varying(20) null default 'pending'::character varying,
  approved_by uuid null,
  approved_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  oral_submission_url text null,
  oral_submission_file_name text null,
  oral_submitted_at timestamp with time zone null,
  written_quiz_answers jsonb null,
  written_quiz_score integer null,
  written_quiz_total_questions integer null,
  written_quiz_correct_answers integer null,
  written_submitted_at timestamp with time zone null,
  written_quiz_submitted_at timestamp with time zone null,
  oral_makhraj_errors integer null default 0,
  oral_sifat_errors integer null default 0,
  oral_mad_errors integer null default 0,
  oral_ghunnah_errors integer null default 0,
  oral_harakat_errors integer null default 0,
  oral_total_score numeric(5, 2) null default null::numeric,
  oral_assessment_status character varying(20) null default 'pending'::character varying,
  oral_assessed_by uuid null,
  oral_assessed_at timestamp with time zone null,
  oral_assessment_notes text null,
  oral_itmamul_harakat_errors integer null default 0,
  exam_juz_number integer null,
  exam_attempt_id uuid null,
  exam_score integer null,
  exam_submitted_at timestamp with time zone null,
  exam_status text null default 'not_started'::text,
  re_enrollment_completed boolean null default false,
  re_enrollment_completed_at timestamp with time zone null,
  re_enrollment_confirmed_by uuid null,
  alasan_mengundurkan_diri text null,
  constraint pendaftaran_tikrar_tahfidz_pkey primary key (id),
  constraint pendaftaran_tikrar_tahfidz_approved_by_fkey foreign KEY (approved_by) references users (id),
  constraint pendaftaran_tikrar_tahfidz_batch_id_fkey foreign KEY (batch_id) references batches (id) on delete RESTRICT,
  -- exam_attempt_fkey will be added after exam_attempts table is created
  constraint pendaftaran_tikrar_tahfidz_user_id_fkey foreign KEY (user_id) references users (id) on delete RESTRICT,
  constraint pendaftaran_tikrar_tahfidz_oral_assessed_by_fkey foreign KEY (oral_assessed_by) references users (id),
  constraint pendaftaran_tikrar_tahfidz_program_id_fkey foreign KEY (program_id) references programs (id) on delete RESTRICT,
  constraint pendaftaran_tikrar_tahfidz_re_enrollment_confirmed_by_fkey foreign KEY (re_enrollment_confirmed_by) references users (id),
  constraint pendaftaran_tikrar_tahfidz_status_check check (
    (
      (status)::text = any (
        array[
          ('pending'::character varying)::text,
          ('approved'::character varying)::text,
          ('rejected'::character varying)::text,
          ('withdrawn'::character varying)::text
        ]
      )
    )
  ),
  constraint oral_assessment_status_check check (
    (
      (oral_assessment_status)::text = any (
        (
          array[
            'pending'::character varying,
            'pass'::character varying,
            'fail'::character varying,
            'not_submitted'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint pendaftaran_tikrar_tahfidz_ready_for_team_check check (
    (
      (ready_for_team)::text = any (
        array[
          ('ready'::character varying)::text,
          ('not_ready'::character varying)::text,
          ('considering'::character varying)::text,
          ('infaq'::character varying)::text
        ]
      )
    )
  ),
  constraint pendaftaran_tikrar_tahfidz_has_permission_check check (
    (
      (has_permission)::text = any (
        array[
          ('yes'::character varying)::text,
          ('janda'::character varying)::text,
          (''::character varying)::text
        ]
      )
    )
  ),
  constraint pendaftaran_tikrar_tahfidz_selection_status_check check (
    (
      (selection_status)::text = any (
        array[
          ('pending'::character varying)::text,
          ('selected'::character varying)::text,
          ('not_selected'::character varying)::text,
          ('waitlist'::character varying)::text
        ]
      )
    )
  ),
  constraint pendaftaran_tikrar_tahfidz_exam_status_check check (
    (
      exam_status = any (
        array[
          'not_started'::text,
          'in_progress'::text,
          'completed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

create index IF not exists idx_pendaftaran_batch_id on public.pendaftaran_tikrar_tahfidz using btree (batch_id) TABLESPACE pg_default;

create index IF not exists idx_pendaftaran_chosen_juz on public.pendaftaran_tikrar_tahfidz using btree (chosen_juz) TABLESPACE pg_default;

create index IF not exists idx_pendaftaran_email on public.pendaftaran_tikrar_tahfidz using btree (email) TABLESPACE pg_default;

create index IF not exists idx_pendaftaran_status on public.pendaftaran_tikrar_tahfidz using btree (status) TABLESPACE pg_default;

create index IF not exists idx_pendaftaran_submission_date on public.pendaftaran_tikrar_tahfidz using btree (submission_date) TABLESPACE pg_default;

create index IF not exists idx_pendaftaran_tikrar_tahfidz_batch_id on public.pendaftaran_tikrar_tahfidz using btree (batch_id) TABLESPACE pg_default;

create index IF not exists idx_pendaftaran_tikrar_tahfidz_selection_status on public.pendaftaran_tikrar_tahfidz using btree (selection_status) TABLESPACE pg_default;

create index IF not exists idx_pendaftaran_tikrar_tahfidz_status on public.pendaftaran_tikrar_tahfidz using btree (status) TABLESPACE pg_default;

create index IF not exists idx_pendaftaran_tikrar_tahfidz_user_id on public.pendaftaran_tikrar_tahfidz using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_pendaftaran_user_id on public.pendaftaran_tikrar_tahfidz using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_pendaftaran_user_batch on public.pendaftaran_tikrar_tahfidz using btree (user_id, batch_id) TABLESPACE pg_default;

create index IF not exists idx_pendaftaran_selection_status on public.pendaftaran_tikrar_tahfidz using btree (selection_status) TABLESPACE pg_default;

create index IF not exists idx_pendaftaran_oral_submitted on public.pendaftaran_tikrar_tahfidz using btree (oral_submitted_at) TABLESPACE pg_default
where
  (oral_submitted_at is not null);

create index IF not exists idx_pendaftaran_written_submitted on public.pendaftaran_tikrar_tahfidz using btree (written_submitted_at) TABLESPACE pg_default
where
  (written_submitted_at is not null);

create index IF not exists idx_oral_assessment_status on public.pendaftaran_tikrar_tahfidz using btree (oral_assessment_status) TABLESPACE pg_default;

create index IF not exists idx_oral_submitted_pending on public.pendaftaran_tikrar_tahfidz using btree (oral_submitted_at, oral_assessment_status) TABLESPACE pg_default
where
  (
    (oral_submitted_at is not null)
    and ((oral_assessment_status)::text = 'pending'::text)
  );

create index IF not exists idx_pendaftaran_re_enrollment_completed on public.pendaftaran_tikrar_tahfidz using btree (re_enrollment_completed) TABLESPACE pg_default
where
  (re_enrollment_completed = true);

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

create trigger handle_pendaftaran_tikrar_tahfidz_updated_at BEFORE
update on pendaftaran_tikrar_tahfidz for EACH ROW
execute FUNCTION public.handle_pendaftaran_tikrar_tahfidz_updated_at ();

create trigger on_re_enrollment_completed
after
update OF re_enrollment_completed on pendaftaran_tikrar_tahfidz for EACH ROW
execute FUNCTION public.handle_re_enrollment_completion ();

create trigger trigger_set_user_tikrar_batch
after
update on pendaftaran_tikrar_tahfidz for EACH ROW
execute FUNCTION public.set_user_current_tikrar_batch ();

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE pendaftaran_tikrar_tahfidz ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ADD COMMENTS
-- ============================================================================

COMMENT ON TABLE public.pendaftaran_tikrar_tahfidz IS 'Pendaftaran untuk program Tikrar Tahfidz';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.re_enrollment_completed IS 'Flag untuk menandai apakah thalibah sudah menyelesaikan proses daftar ulang';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.exam_status IS 'Status ujian: not_started, in_progress, completed';
