-- Add selection fields to pendaftaran_tikrar_tahfidz table
-- These fields will track the oral and written selection submissions

-- Add oral selection fields
ALTER TABLE public.pendaftaran_tikrar_tahfidz
ADD COLUMN IF NOT EXISTS oral_submission_url text,
ADD COLUMN IF NOT EXISTS oral_submission_file_name text,
ADD COLUMN IF NOT EXISTS oral_submitted_at timestamp with time zone;

-- Add written selection fields
ALTER TABLE public.pendaftaran_tikrar_tahfidz
ADD COLUMN IF NOT EXISTS written_quiz_answers jsonb,
ADD COLUMN IF NOT EXISTS written_quiz_score integer,
ADD COLUMN IF NOT EXISTS written_quiz_total_questions integer,
ADD COLUMN IF NOT EXISTS written_quiz_correct_answers integer,
ADD COLUMN IF NOT EXISTS written_submitted_at timestamp with time zone;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_pendaftaran_oral_submitted
ON public.pendaftaran_tikrar_tahfidz(oral_submitted_at)
WHERE oral_submitted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pendaftaran_written_submitted
ON public.pendaftaran_tikrar_tahfidz(written_submitted_at)
WHERE written_submitted_at IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.oral_submission_url IS 'URL to the uploaded oral selection audio file';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.oral_submission_file_name IS 'Original filename of the oral selection audio';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.oral_submitted_at IS 'Timestamp when oral selection was submitted';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.written_quiz_answers IS 'JSON object containing quiz answers';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.written_quiz_score IS 'Score achieved in written quiz (percentage)';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.written_quiz_total_questions IS 'Total number of questions in written quiz';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.written_quiz_correct_answers IS 'Number of correct answers in written quiz';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.written_submitted_at IS 'Timestamp when written quiz was submitted';