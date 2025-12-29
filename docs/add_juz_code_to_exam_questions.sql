-- ============================================
-- Add juz_code column to exam_questions table
-- This allows tracking which specific juz option (30A, 30B, etc.)
-- a question belongs to, while keeping juz_number for queries
-- ============================================

-- Drop existing foreign key if it exists (to fix issues)
ALTER TABLE public.exam_questions
DROP CONSTRAINT IF EXISTS exam_questions_juz_code_fkey;

-- Add juz_code column (nullable)
ALTER TABLE public.exam_questions
ADD COLUMN IF NOT EXISTS juz_code text;

-- Add index for juz_code queries
CREATE INDEX IF NOT EXISTS idx_exam_questions_juz_code
ON public.exam_questions(juz_code);

-- Add comment
COMMENT ON COLUMN public.exam_questions.juz_code IS 'Reference to juz_options.code (e.g., "30A", "29B") for more specific tracking';

-- ============================================
-- Update existing data to populate juz_code
-- This maps existing juz_number to appropriate juz codes
-- ============================================

-- For Juz 30 questions, default to 30A
UPDATE public.exam_questions
SET juz_code = '30A'
WHERE juz_number = 30 AND juz_code IS NULL;

-- For Juz 29 questions, default to 29A
UPDATE public.exam_questions
SET juz_code = '29A'
WHERE juz_number = 29 AND juz_code IS NULL;

-- For Juz 28 questions, default to 28A
UPDATE public.exam_questions
SET juz_code = '28A'
WHERE juz_number = 28 AND juz_code IS NULL;
