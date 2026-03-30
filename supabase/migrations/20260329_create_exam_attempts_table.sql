-- ============================================================================
-- CREATE EXAM_ATTEMPTS TABLE
-- ============================================================================
-- This migration creates the exam_attempts table for tracking exam attempts.
--
-- Author: Generated as part of security audit fixes
-- Date: 2026-03-29
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_exam_attempts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  registration_id uuid NOT NULL,
  exam_type character varying(50) NOT NULL DEFAULT 'oral',
  juz_number integer NOT NULL,
  started_at timestamp with time zone DEFAULT NOW(),
  completed_at timestamp with time zone,
  status character varying(20) DEFAULT 'in_progress',
  score integer,
  total_questions integer,
  correct_answers integer,
  answers jsonb,
  feedback text,
  assessed_by uuid,
  assessed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW(),

  CONSTRAINT exam_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT exam_attempts_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES pendaftaran_tikrar_tahfidz(id) ON DELETE RESTRICT,
  CONSTRAINT exam_attempts_assessed_by_fkey FOREIGN KEY (assessed_by) REFERENCES users(id),
  CONSTRAINT exam_attempts_status_check CHECK (
    status IN ('not_started', 'in_progress', 'completed', 'graded')
  ),
  CONSTRAINT exam_attempts_type_check CHECK (
    exam_type IN ('oral', 'written', 'practical')
  )
) TABLESPACE pg_default;

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_exam_attempts_user_id ON public.exam_attempts USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_registration_id ON public.exam_attempts USING btree (registration_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_status ON public.exam_attempts USING btree (status);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_type ON public.exam_attempts USING btree (exam_type);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_juz ON public.exam_attempts USING btree (juz_number);

-- ============================================================================
-- CREATE TRIGGER
-- ============================================================================

CREATE TRIGGER handle_exam_attempts_updated_at_trigger
BEFORE UPDATE ON exam_attempts
FOR EACH ROW
EXECUTE FUNCTION public.handle_exam_attempts_updated_at();

-- ============================================================================
-- ADD COMMENTS
-- ============================================================================

COMMENT ON TABLE public.exam_attempts IS 'Exam attempts for oral, written, and practical assessments';
COMMENT ON COLUMN public.exam_attempts.exam_type IS 'Type: oral, written, practical';
COMMENT ON COLUMN public.exam_attempts.status IS 'Status: not_started, in_progress, completed, graded';

-- ============================================================================
-- ADD FOREIGN KEY TO PENDAFTARAN_TIKRAR_TAHFIDZ (for exam_attempt_id)
-- ============================================================================

ALTER TABLE public.pendaftaran_tikrar_tahfidz
ADD CONSTRAINT IF NOT EXISTS pendaftaran_tikrar_tahfidz_exam_attempt_fkey
FOREIGN KEY (exam_attempt_id) REFERENCES exam_attempts(id) ON DELETE SET NULL;
