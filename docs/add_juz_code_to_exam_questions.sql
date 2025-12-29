-- ============================================
-- Add juz_code column to exam_questions table
-- This allows tracking which specific juz option (30A, 30B, etc.)
-- a question belongs to, while keeping juz_number for queries
-- ============================================

-- Add juz_code column (nullable for now, will be populated)
ALTER TABLE public.exam_questions
ADD COLUMN IF NOT EXISTS juz_code text;

-- Add foreign key constraint to juz_options
ALTER TABLE public.exam_questions
ADD CONSTRAINT exam_questions_juz_code_fkey
FOREIGN KEY (juz_code)
REFERENCES public.juz_options(code)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Add index for juz_code queries
CREATE INDEX IF NOT EXISTS idx_exam_questions_juz_code
ON public.exam_questions(juz_code);

-- Add comment
COMMENT ON COLUMN public.exam_questions.juz_code IS 'Reference to juz_options.code (e.g., "30A", "29B") for more specific tracking';

-- ============================================
-- Update existing data to populate juz_code
-- This maps existing juz_number to appropriate juz codes
-- ============================================

-- For Juz 30 questions, default to 30A (you may want to adjust this)
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

-- Optionally, make juz_code required after all data is populated
-- Uncomment this line after verifying all records have juz_code set
-- ALTER TABLE public.exam_questions ALTER COLUMN juz_code SET NOT NULL;
