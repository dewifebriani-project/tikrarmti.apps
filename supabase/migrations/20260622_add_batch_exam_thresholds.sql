-- ============================================================================
-- ADD DYNAMIC EXAM THRESHOLDS TO BATCHES TABLE
-- ============================================================================

-- Add min_exam_score column (defaults to 70 for backward compatibility)
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS min_exam_score INTEGER DEFAULT 70;

-- Add min_final_exam_score column (defaults to 70 for backward compatibility)
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS min_final_exam_score INTEGER DEFAULT 70;

-- Comment on columns
COMMENT ON COLUMN public.batches.min_exam_score IS 'Minimum score required on selection written exam to avoid juz adjustment (e.g., 70 for batch 2, 80 for batch 3+)';
COMMENT ON COLUMN public.batches.min_final_exam_score IS 'Minimum score required on graduation final written exam';
