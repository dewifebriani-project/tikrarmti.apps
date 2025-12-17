-- ==========================================
-- Database Updates for Selection System (Fixed)
-- ==========================================
-- Run these queries in Supabase Dashboard SQL Editor

-- 1. Add selection fields to pendaftaran_tikrar_tahfidz table
ALTER TABLE public.pendaftaran_tikrar_tahfidz
ADD COLUMN IF NOT EXISTS oral_submission_url text,
ADD COLUMN IF NOT EXISTS oral_submission_file_name text,
ADD COLUMN IF NOT EXISTS oral_submitted_at timestamp with time zone;

ALTER TABLE public.pendaftaran_tikrar_tahfidz
ADD COLUMN IF NOT EXISTS written_quiz_answers jsonb,
ADD COLUMN IF NOT EXISTS written_quiz_score integer,
ADD COLUMN IF NOT EXISTS written_quiz_total_questions integer,
ADD COLUMN IF NOT EXISTS written_quiz_correct_answers integer,
ADD COLUMN IF NOT EXISTS written_quiz_submitted_at timestamp with time zone;

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pendaftaran_oral_submitted
ON public.pendaftaran_tikrar_tahfidz(oral_submitted_at)
WHERE oral_submitted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pendaftaran_written_submitted
ON public.pendaftaran_tikrar_tahfidz(written_quiz_submitted_at)
WHERE written_quiz_submitted_at IS NOT NULL;

-- 3. Create storage bucket for selection audios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'selection-audios',
  'selection-audios',
  true,
  10485760, -- 10MB
  ARRAY['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mp3', 'audio/mpeg']
) ON CONFLICT (id) DO NOTHING;

-- 4. Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous users to read selection audios" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload selection audios" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own selection audios" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read selection audios" ON storage.objects;

-- 5. Create RLS policies for the bucket
-- Allow anonymous read
CREATE POLICY "Allow anonymous users to read selection audios"
ON storage.objects FOR SELECT
USING (bucket_id = 'selection-audios');

-- Allow authenticated upload
CREATE POLICY "Allow users to upload selection audios"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'selection-audios' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated update
CREATE POLICY "Allow users to update own selection audios"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'selection-audios' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated read (backup)
CREATE POLICY "Allow authenticated users to read selection audios"
ON storage.objects FOR SELECT
USING (bucket_id = 'selection-audios' AND auth.role() = 'authenticated');

-- 6. Grant necessary permissions
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.buckets TO anon;
GRANT SELECT ON storage.objects TO anon;

-- 7. Add comments for documentation (fixed syntax)
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.oral_submission_url IS 'URL to the uploaded oral selection audio file';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.oral_submission_file_name IS 'Original filename of the oral selection audio';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.oral_submitted_at IS 'Timestamp when oral selection was submitted';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.written_quiz_answers IS 'JSON object containing quiz answers';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.written_quiz_score IS 'Score achieved in written quiz (percentage)';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.written_quiz_total_questions IS 'Total number of questions in written quiz';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.written_quiz_correct_answers IS 'Number of correct answers in written quiz';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.written_quiz_submitted_at IS 'Timestamp when written quiz was submitted';

-- 8. Verify the changes
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'pendaftaran_tikrar_tahfidz'
  AND table_schema = 'public'
  AND (column_name LIKE '%oral%' OR column_name LIKE '%written%')
ORDER BY column_name;

-- Check bucket creation
SELECT * FROM storage.buckets WHERE id = 'selection-audios';