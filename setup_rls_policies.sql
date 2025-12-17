-- Setup RLS Policies for selection-audios bucket
-- Run this after bucket is created

-- 1. Drop existing policies if any
DROP POLICY IF EXISTS "Allow anonymous users to read selection audios" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload selection audios" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own selection audios" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read selection audios" ON storage.objects;

-- 2. Create new policies
-- Allow anonymous users to read files (public access)
CREATE POLICY "Allow anonymous users to read selection audios"
ON storage.objects FOR SELECT
USING (bucket_id = 'selection-audios');

-- Allow authenticated users to upload audio files
CREATE POLICY "Allow users to upload selection audios"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'selection-audios' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to update their files
CREATE POLICY "Allow users to update own selection audios"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'selection-audios' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to read files (backup for RLS)
CREATE POLICY "Allow authenticated users to read selection audios"
ON storage.objects FOR SELECT
USING (bucket_id = 'selection-audios' AND auth.role() = 'authenticated');

-- 3. Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage';