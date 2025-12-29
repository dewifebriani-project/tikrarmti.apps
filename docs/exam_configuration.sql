-- ============================================
-- Exam Configurations Table
-- Settings for exam behavior (duration, attempts, timing, etc.)
-- ============================================

CREATE TABLE IF NOT EXISTS public.exam_configurations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,

  -- Exam timing
  duration_minutes integer NOT NULL DEFAULT 30, -- Duration in minutes
  start_time timestamp with time zone, -- Exam start time (optional)
  end_time timestamp with time zone, -- Exam end time (optional)

  -- Attempt settings
  max_attempts integer DEFAULT 1, -- Maximum number of attempts (null = unlimited)

  -- Question settings
  shuffle_questions boolean DEFAULT false, -- Randomize question order
  randomize_order boolean DEFAULT false, -- Randomize option order
  show_questions_all boolean DEFAULT true, -- Show all questions or one by one
  questions_per_attempt integer, -- Limit questions per attempt (null = all)

  -- Scoring settings
  passing_score integer DEFAULT 70, -- Minimum score to pass (0-100)
  auto_grade boolean DEFAULT true, -- Automatically grade exam
  score_calculation_mode text DEFAULT 'highest', -- 'highest' or 'average' - how to calculate final score from multiple attempts

  -- Behavior settings
  allow_review boolean DEFAULT false, -- Allow reviewing answers after submit
  show_results boolean DEFAULT true, -- Show results immediately
  auto_submit_on_timeout boolean DEFAULT true, -- Auto-submit when time runs out

  -- Access control
  is_active boolean DEFAULT true,

  -- Metadata
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,

  CONSTRAINT exam_configurations_pkey PRIMARY KEY (id),
  CONSTRAINT exam_configurations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_exam_configurations_active ON public.exam_configurations(is_active);

-- Add comments
COMMENT ON TABLE public.exam_configurations IS 'Configuration settings for exam behavior';
COMMENT ON COLUMN public.exam_configurations.duration_minutes IS 'Exam duration in minutes';
COMMENT ON COLUMN public.exam_configurations.max_attempts IS 'Maximum allowed attempts (null = unlimited)';
COMMENT ON COLUMN public.exam_configurations.shuffle_questions IS 'Randomize question order for each attempt';
COMMENT ON COLUMN public.exam_configurations.passing_score IS 'Minimum score (0-100) to pass the exam';
COMMENT ON COLUMN public.exam_configurations.score_calculation_mode IS 'How to calculate final score: "highest" (take best score) or "average" (take average of all attempts)';

-- ============================================
-- Add configuration_id to exam_attempts
-- ============================================

ALTER TABLE public.exam_attempts
ADD COLUMN IF NOT EXISTS configuration_id uuid REFERENCES public.exam_configurations(id);

CREATE INDEX IF NOT EXISTS idx_exam_attempts_config ON public.exam_attempts(configuration_id);

-- ============================================
-- Add columns for tracking attempt details
-- ============================================

ALTER TABLE public.exam_attempts
ADD COLUMN IF NOT EXISTS attempt_number integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS time_taken integer, -- Time taken in seconds
ADD COLUMN IF NOT EXISTS passed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS started_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS is_graded boolean DEFAULT false;

-- Update the started_at column comment
COMMENT ON COLUMN public.exam_attempts.started_at IS 'When the exam attempt was started';
COMMENT ON COLUMN public.exam_attempts.time_taken IS 'Total time taken to complete (in seconds)';
COMMENT ON COLUMN public.exam_attempts.passed IS 'Whether the attempt passed (based on passing_score)';
COMMENT ON COLUMN public.exam_attempts.attempt_number IS 'Attempt number for this user/registration';

-- ============================================
-- Create function to get exam configuration
-- ============================================

CREATE OR REPLACE FUNCTION get_exam_config(juz_num integer)
RETURNS TABLE (
  id uuid,
  duration_minutes integer,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  max_attempts integer,
  shuffle_questions boolean,
  passing_score integer,
  auto_submit_on_timeout boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ec.id,
    ec.duration_minutes,
    ec.start_time,
    ec.end_time,
    ec.max_attempts,
    ec.shuffle_questions,
    ec.passing_score,
    ec.auto_submit_on_timeout
  FROM public.exam_configurations ec
  WHERE ec.is_active = true
  ORDER BY ec.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Insert default configuration
-- ============================================

INSERT INTO public.exam_configurations (
  name,
  description,
  duration_minutes,
  max_attempts,
  shuffle_questions,
  randomize_order,
  passing_score,
  auto_grade,
  score_calculation_mode,
  allow_review,
  show_results,
  auto_submit_on_timeout,
  is_active
) VALUES (
  'Default Exam Configuration',
  'Konfigurasi default untuk ujian pilihan ganda',
  30,
  1,
  false,
  false,
  70,
  true,
  'highest',
  false,
  true,
  true,
  true
) ON CONFLICT DO NOTHING;
