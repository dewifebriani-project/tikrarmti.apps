-- ============================================
-- MTI Exam System Database Migration
-- Ujian Pilihan Ganda untuk Juz 28, 29, 30
-- ============================================

-- Table 1: Exam Questions Bank (Universal for all Juz)
CREATE TABLE IF NOT EXISTS public.exam_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  juz_number integer NOT NULL CHECK (juz_number IN (28, 29, 30)),
  section_number integer NOT NULL CHECK (section_number >= 1 AND section_number <= 9),
  section_title text NOT NULL, -- e.g., "Tebak Nama Surat", "Ayat Mutasyabihat"
  question_number integer NOT NULL, -- Question order within section
  question_text text NOT NULL, -- The actual question (Arabic text or instruction)
  question_type text NOT NULL CHECK (question_type IN ('multiple_choice', 'introduction')),

  -- Multiple choice options (stored as JSONB array)
  -- Format: [{"text": "Ath-Thariq", "isCorrect": true}, {"text": "Al-Ghasiyah", "isCorrect": false}, ...]
  options jsonb,

  -- Correct answer (for validation)
  correct_answer text,

  -- Points for this question
  points integer DEFAULT 1,

  -- Metadata
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,

  CONSTRAINT exam_questions_pkey PRIMARY KEY (id),
  CONSTRAINT exam_questions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_exam_questions_juz ON public.exam_questions(juz_number);
CREATE INDEX IF NOT EXISTS idx_exam_questions_section ON public.exam_questions(juz_number, section_number);

-- Table 2: Exam Attempts (User submissions)
CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  registration_id uuid NOT NULL, -- Link to pendaftaran_tikrar_tahfidz
  juz_number integer NOT NULL CHECK (juz_number IN (28, 29, 30)),

  -- Exam session info
  started_at timestamp with time zone DEFAULT now(),
  submitted_at timestamp with time zone,

  -- Answers (stored as JSONB)
  -- Format: [{"questionId": "uuid", "answer": "Ath-Thariq", "isCorrect": true}, ...]
  answers jsonb,

  -- Scoring
  total_questions integer NOT NULL DEFAULT 100,
  correct_answers integer DEFAULT 0,
  score integer DEFAULT 0, -- Percentage score (0-100)

  -- Status
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded')),

  -- Metadata
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  CONSTRAINT exam_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT exam_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT exam_attempts_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.pendaftaran_tikrar_tahfidz(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user ON public.exam_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_registration ON public.exam_attempts(registration_id);

-- Table 3: Question Flags (Thalibah reports incorrect questions)
CREATE TABLE IF NOT EXISTS public.exam_question_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL,
  user_id uuid NOT NULL,
  attempt_id uuid, -- Optional: which attempt this flag came from

  -- Flag details
  flag_type text NOT NULL CHECK (flag_type IN ('wrong_answer', 'typo', 'unclear', 'other')),
  flag_message text, -- Optional message from user

  -- Admin response
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'fixed', 'rejected', 'invalid')),
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,

  -- Metadata
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  CONSTRAINT exam_question_flags_pkey PRIMARY KEY (id),
  CONSTRAINT exam_question_flags_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.exam_questions(id),
  CONSTRAINT exam_question_flags_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT exam_question_flags_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.exam_attempts(id),
  CONSTRAINT exam_question_flags_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_exam_flags_question ON public.exam_question_flags(question_id);
CREATE INDEX IF NOT EXISTS idx_exam_flags_status ON public.exam_question_flags(status);

-- ============================================
-- Add columns to pendaftaran_tikrar_tahfidz
-- ============================================

-- Add exam score fields if not exists
ALTER TABLE public.pendaftaran_tikrar_tahfidz
ADD COLUMN IF NOT EXISTS exam_juz_number integer, -- Which juz exam they took (28, 29, or 30)
ADD COLUMN IF NOT EXISTS exam_attempt_id uuid, -- Link to exam_attempts
ADD COLUMN IF NOT EXISTS exam_score integer, -- Final score (0-100)
ADD COLUMN IF NOT EXISTS exam_submitted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS exam_status text DEFAULT 'not_started' CHECK (exam_status IN ('not_started', 'in_progress', 'completed'));

-- Add foreign key constraint
ALTER TABLE public.pendaftaran_tikrar_tahfidz
ADD CONSTRAINT pendaftaran_tikrar_tahfidz_exam_attempt_fkey
FOREIGN KEY (exam_attempt_id) REFERENCES public.exam_attempts(id);

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_question_flags ENABLE ROW LEVEL SECURITY;

-- Exam Questions Policies
-- 1. Admin can do everything
CREATE POLICY "Admin full access to exam questions"
ON public.exam_questions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 2. Thalibah can only read active questions for their assigned juz
CREATE POLICY "Thalibah can read active exam questions"
ON public.exam_questions
FOR SELECT
TO authenticated
USING (is_active = true);

-- Exam Attempts Policies
-- 1. Admin can view all attempts
CREATE POLICY "Admin can view all exam attempts"
ON public.exam_attempts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 2. Users can only view/manage their own attempts
CREATE POLICY "Users can manage own exam attempts"
ON public.exam_attempts
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Exam Flags Policies
-- 1. Admin can view all flags
CREATE POLICY "Admin can view all exam flags"
ON public.exam_question_flags
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 2. Users can create flags and view their own
CREATE POLICY "Users can create and view own flags"
ON public.exam_question_flags
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================
-- Helper Function: Determine Required Exam Juz
-- ============================================

CREATE OR REPLACE FUNCTION get_required_exam_juz(chosen_juz text)
RETURNS integer AS $$
BEGIN
  -- Juz 30A or 30B -> No exam required
  IF chosen_juz LIKE '30%' THEN
    RETURN NULL;
  -- Juz 29A or 29B -> Exam Juz 30
  ELSIF chosen_juz LIKE '29%' THEN
    RETURN 30;
  -- Juz 28A or 28B -> Exam Juz 29
  ELSIF chosen_juz LIKE '28%' THEN
    RETURN 29;
  -- Juz 1A or 1B -> Exam Juz 30
  ELSIF chosen_juz LIKE '1%' THEN
    RETURN 30;
  -- Default: no exam
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- Sample Data Insert (Section Metadata)
-- ============================================

COMMENT ON TABLE public.exam_questions IS 'Bank soal ujian pilihan ganda untuk Juz 28, 29, 30';
COMMENT ON TABLE public.exam_attempts IS 'Rekaman percobaan ujian oleh thalibah';
COMMENT ON TABLE public.exam_question_flags IS 'Flag/laporan dari thalibah untuk soal yang bermasalah';

-- ============================================
-- Update database_schema.md tracking
-- ============================================

COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.exam_juz_number IS 'Juz number for required exam (28, 29, or 30)';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.exam_attempt_id IS 'Reference to exam_attempts table';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.exam_score IS 'Final exam score (0-100)';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.exam_submitted_at IS 'When exam was submitted';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.exam_status IS 'Exam completion status';
