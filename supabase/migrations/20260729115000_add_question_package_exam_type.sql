ALTER TABLE public.exam_questions 
ADD COLUMN IF NOT EXISTS question_package text DEFAULT 'B';

ALTER TABLE public.exam_configurations 
ADD COLUMN IF NOT EXISTS exam_type text DEFAULT 'selection';