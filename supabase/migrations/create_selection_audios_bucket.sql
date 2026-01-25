-- Create storage bucket for selection audio recordings
-- This bucket stores audio files uploaded by candidates during the selection process

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'selection-audios',
  'selection-audios',
  true, -- Public bucket so URLs can be accessed
  10485760, -- 10MB limit (10 * 1024 * 1024 bytes)
  ARRAY['audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav'];

-- Policy 1: Allow authenticated users to upload their own files
-- Filename format: {user_id}_alfath29_{timestamp}.webm
CREATE POLICY "Authenticated users can upload audio files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'selection-audios' AND
  -- Check if filename starts with user's UUID
  name LIKE auth.uid()::text || '_%'
);

-- Policy 2: Allow authenticated users to view/download any audio files
CREATE POLICY "Authenticated users can view audio files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'selection-audios');

-- Policy 3: Allow users to update their own files
CREATE POLICY "Users can update their own audio files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'selection-audios' AND
  name LIKE auth.uid()::text || '_%'
)
WITH CHECK (
  bucket_id = 'selection-audios' AND
  name LIKE auth.uid()::text || '_%'
);

-- Policy 4: Allow users to delete their own files
CREATE POLICY "Users can delete their own audio files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'selection-audios' AND
  name LIKE auth.uid()::text || '_%'
);

-- Policy 5: Allow admin/staff to view all files
CREATE POLICY "Admin and staff can view all audio files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'selection-audios' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'musyrifah', 'muallimah')
  )
);

-- Policy 6: Allow admin to delete any files
CREATE POLICY "Admin can delete any audio files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'selection-audios' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
