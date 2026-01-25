-- Add current_question_index column to exam_attempts table
-- This column stores the last viewed question index for autosave/restore functionality

ALTER TABLE public.exam_attempts
ADD COLUMN IF NOT EXISTS current_question_index integer;

-- Add comment for documentation
COMMENT ON COLUMN public.exam_attempts.current_question_index IS 'Last viewed question index (0-based) for autosave/restore functionality';
