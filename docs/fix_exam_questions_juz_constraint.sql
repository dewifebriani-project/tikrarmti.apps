-- ============================================
-- Remove juz_number check constraint from exam_questions
-- This allows questions for any juz number, not just 28, 29, 30
-- ============================================

-- Drop the check constraint
ALTER TABLE public.exam_questions
DROP CONSTRAINT IF EXISTS exam_questions_juz_number_check;

-- Verify the constraint is removed
-- (run this separately to check)
-- SELECT * FROM information_schema.table_constraints
-- WHERE table_name = 'exam_questions';
