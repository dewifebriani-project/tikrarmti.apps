-- ============================================================================
-- RECREATE DAFTAR_ULANG_SUBMISSIONS WITH OLD PROJECT STRUCTURE
-- ============================================================================
-- This drops the new table and recreates it with the exact structure from
-- the old project to support CSV import.
--
-- Author: Generated to support data migration from old project
-- Date: 2026-03-29
-- ============================================================================

-- Drop existing table and cascade
DROP TABLE IF EXISTS public.daftar_ulang_submissions CASCADE;

-- Drop old trigger function if exists
DROP FUNCTION IF EXISTS public.handle_daftar_ulang_approval() CASCADE;

-- ============================================================================
-- HELPER FUNCTION: Handle daftar ulang approval
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_daftar_ulang_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- When status changes to 'approved', update user's current_tikrar_batch_id
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE public.users
    SET current_tikrar_batch_id = NEW.batch_id
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE TABLE WITH OLD STRUCTURE
-- ============================================================================
create table public.daftar_ulang_submissions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  registration_id uuid not null,
  batch_id uuid not null,
  confirmed_full_name character varying not null,
  confirmed_chosen_juz character varying not null,
  confirmed_main_time_slot character varying not null,
  confirmed_backup_time_slot character varying not null,
  confirmed_wa_phone character varying null,
  confirmed_address text null,
  partner_type character varying not null,
  partner_user_id uuid null,
  partner_name character varying null,
  partner_relationship character varying null,
  partner_notes text null,
  ujian_halaqah_id uuid null,
  tashih_halaqah_id uuid null,
  is_tashih_umum boolean null default false,
  akad_url text null,
  akad_file_name character varying null,
  akad_submitted_at timestamp with time zone null,
  status character varying not null default 'draft'::character varying,
  submitted_at timestamp with time zone null,
  reviewed_at timestamp with time zone null,
  reviewed_by uuid null,
  review_notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  partner_wa_phone character varying null,
  pairing_status text null default 'pending'::text,
  rejection_reason text null,
  akad_files jsonb null default '[]'::jsonb,
  constraint daftar_ulang_submissions_pkey primary key (id),
  constraint daftar_ulang_submissions_user_id_key unique (user_id, registration_id),
  constraint daftar_ulang_submissions_reviewed_by_fkey foreign KEY (reviewed_by) references users (id),
  constraint daftar_ulang_submissions_partner_user_id_fkey foreign KEY (partner_user_id) references users (id),
  constraint daftar_ulang_submissions_tashih_halaqah_id_fkey foreign KEY (tashih_halaqah_id) references halaqah (id),
  constraint daftar_ulang_submissions_ujian_halaqah_id_fkey foreign KEY (ujian_halaqah_id) references halaqah (id),
  constraint daftar_ulang_submissions_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint daftar_ulang_submissions_registration_id_fkey foreign KEY (registration_id) references pendaftaran_tikrar_tahfidz (id) on delete CASCADE,
  constraint daftar_ulang_submissions_batch_id_fkey foreign KEY (batch_id) references batches (id),
  constraint daftar_ulang_submissions_partner_type_check check (
    (
      (partner_type)::text = any (
        (
          array[
            'self_match'::character varying,
            'system_match'::character varying,
            'family'::character varying,
            'tarteel'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint daftar_ulang_submissions_status_check check (
    (
      (status)::text = any (
        (
          array[
            'draft'::character varying,
            'submitted'::character varying,
            'approved'::character varying,
            'rejected'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint daftar_ulang_submissions_pairing_status_check check (
    (
      pairing_status = any (
        array['pending'::text, 'paired'::text, 'rejected'::text]
      )
    )
  )
) TABLESPACE pg_default;

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================
create index IF not exists idx_daftar_ulang_user_batch on public.daftar_ulang_submissions using btree (user_id, batch_id) TABLESPACE pg_default;

create index IF not exists idx_daftar_ulang_status on public.daftar_ulang_submissions using btree (status) TABLESPACE pg_default;

create index IF not exists idx_daftar_ulang_submissions_user_id on public.daftar_ulang_submissions using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_daftar_ulang_submissions_registration_id on public.daftar_ulang_submissions using btree (registration_id) TABLESPACE pg_default;

create index IF not exists idx_daftar_ulang_submissions_batch_id on public.daftar_ulang_submissions using btree (batch_id) TABLESPACE pg_default;

create index IF not exists idx_daftar_ulang_submissions_status on public.daftar_ulang_submissions using btree (status) TABLESPACE pg_default;

create index IF not exists idx_daftar_ulang_submissions_ujian_halaqah on public.daftar_ulang_submissions using btree (ujian_halaqah_id) TABLESPACE pg_default;

create index IF not exists idx_daftar_ulang_submissions_tashih_halaqah on public.daftar_ulang_submissions using btree (tashih_halaqah_id) TABLESPACE pg_default;

-- ============================================================================
-- CREATE TRIGGER
-- ============================================================================
create trigger trigger_daftar_ulang_approval_role
after
update OF status on daftar_ulang_submissions for EACH ROW when (
  old.status::text is distinct from new.status::text
)
execute FUNCTION handle_daftar_ulang_approval ();

-- ============================================================================
-- ENABLE RLS
-- ============================================================================
ALTER TABLE daftar_ulang_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RECREATE RLS POLICIES FOR NEW TABLE STRUCTURE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own daftar_ulang" ON daftar_ulang_submissions;
DROP POLICY IF EXISTS "Users can create own daftar_ulang" ON daftar_ulang_submissions;
DROP POLICY IF EXISTS "Users can update own daftar_ulang" ON daftar_ulang_submissions;
DROP POLICY IF EXISTS "Staff can view all daftar_ulang" ON daftar_ulang_submissions;
DROP POLICY IF EXISTS "Admins can manage all daftar_ulang" ON daftar_ulang_submissions;

-- Self-access policies
CREATE POLICY "Users can view own daftar_ulang"
ON daftar_ulang_submissions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own daftar_ulang"
ON daftar_ulang_submissions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daftar_ulang"
ON daftar_ulang_submissions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Staff policies (muallimah and above can view)
CREATE POLICY "Staff can view all daftar_ulang"
ON daftar_ulang_submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_minimum_rank(u.roles, 60)  -- muallimah and above
  )
);

-- Admin policies
CREATE POLICY "Admins can manage all daftar_ulang"
ON daftar_ulang_submissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['admin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND has_any_role(u.roles, ARRAY['admin'])
  )
);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.daftar_ulang_submissions IS 'Daftar ulang (re-enrollment) submissions - structure from old project';
COMMENT ON COLUMN public.daftar_ulang_submissions.status IS 'Status: draft, submitted, approved, rejected';
COMMENT ON COLUMN public.daftar_ulang_submissions.partner_type IS 'Partner type: self_match, system_match, family, tarteel';
COMMENT ON COLUMN public.daftar_ulang_submissions.pairing_status IS 'Pairing status: pending, paired, rejected';
