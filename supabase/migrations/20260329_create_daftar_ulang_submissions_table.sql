-- ============================================================================
-- CREATE DAFTAR_ULANG_SUBMISSIONS TABLE
-- ============================================================================
-- This migration creates the daftar_ulang_submissions table for re-enrollment.
--
-- Author: Generated as part of security audit fixes
-- Date: 2026-03-29
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_daftar_ulang_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.daftar_ulang_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  full_name character varying(255) NOT NULL,
  email character varying(255) NOT NULL,
  wa_phone character varying(20) NOT NULL,
  telegram_phone character varying(20),
  address text,
  current_juz integer NOT NULL,
  current_page integer NOT NULL,
  target_juz integer NOT NULL,
  chosen_juz character varying(10) NOT NULL,
  main_time_slot character varying(20) NOT NULL,
  backup_time_slot character varying(20) NOT NULL,
  has_telegram boolean NOT NULL DEFAULT false,
  saved_contact boolean NOT NULL DEFAULT false,
  understands_commitment boolean NOT NULL DEFAULT false,
  no_travel_plans boolean NOT NULL DEFAULT false,
  motivation text,
  questions text,
  submission_date timestamp with time zone DEFAULT NOW(),
  status character varying(20) DEFAULT 'pending',
  approved_by uuid,
  approved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW(),

  CONSTRAINT daftar_ulang_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT daftar_ulang_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE RESTRICT,
  CONSTRAINT daftar_ulang_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES users(id),
  CONSTRAINT daftar_ulang_status_check CHECK (
    status IN ('pending', 'approved', 'rejected', 'withdrawn')
  )
) TABLESPACE pg_default;

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_daftar_ulang_user_id ON public.daftar_ulang_submissions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_daftar_ulang_batch_id ON public.daftar_ulang_submissions USING btree (batch_id);
CREATE INDEX IF NOT EXISTS idx_daftar_ulang_status ON public.daftar_ulang_submissions USING btree (status);
CREATE INDEX IF NOT EXISTS idx_daftar_ulang_submission_date ON public.daftar_ulang_submissions USING btree (submission_date);
CREATE INDEX IF NOT EXISTS idx_daftar_ulang_user_batch ON public.daftar_ulang_submissions USING btree (user_id, batch_id);

-- ============================================================================
-- CREATE TRIGGER
-- ============================================================================

CREATE TRIGGER handle_daftar_ulang_updated_at_trigger
BEFORE UPDATE ON daftar_ulang_submissions
FOR EACH ROW
EXECUTE FUNCTION public.handle_daftar_ulang_updated_at();

-- ============================================================================
-- ADD COMMENTS
-- ============================================================================

COMMENT ON TABLE public.daftar_ulang_submissions IS 'Daftar ulang (re-enrollment) submissions for returning thalibah';
COMMENT ON COLUMN public.daftar_ulang_submissions.status IS 'Status: pending, approved, rejected, withdrawn';
