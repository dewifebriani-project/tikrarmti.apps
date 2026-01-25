-- Add juz_selection column to programs table
-- This column will store which juz options the program covers (e.g., '["28A","28B"]' or '[28,29,30]')

ALTER TABLE public.programs
ADD COLUMN IF NOT EXISTS juz_selection JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.programs.juz_selection IS 'JSON array of juz options/numbers that this program covers. Example: ["28A","28B"] or [28,29,30]';

-- Update existing programs based on their class_type
-- For tikrar_tahfidz programs, they typically cover all juz (28, 29, 30)
UPDATE public.programs
SET juz_selection = '[28,29,30]'::jsonb
WHERE class_type = 'tikrar_tahfidz' AND juz_selection = '[]'::jsonb;

-- For other program types, set based on common patterns
-- You may need to adjust these based on your actual program structure

-- Verify the changes
SELECT
  p.id,
  p.name,
  p.class_type,
  p.juz_selection
FROM public.programs p
ORDER BY p.created_at DESC
LIMIT 10;
