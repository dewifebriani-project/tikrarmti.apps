-- Fix selection-audios bucket policies
-- This script removes duplicate/conflicting policies and creates the correct ones

-- Step 1: Drop ALL existing policies on storage.objects for selection-audios bucket
DROP POLICY IF EXISTS "Allow anonymous users to read selection audios" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload selection audios" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own selection audios" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read selection audios" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Admin and staff can view all audio files" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete any audio files" ON storage.objects;

-- Step 2: Create clean policies from scratch

-- Policy 1: Allow authenticated users to INSERT (upload) their own files
-- File naming convention: {user_id}_alfath29_{timestamp}.webm
CREATE POLICY "upload_own_audio"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'selection-audios' AND
  (storage.foldername(name))[1] = ''::text AND -- Ensure no folder structure
  name ~ ('^' || auth.uid()::text || '_alfath29_[0-9]+\.webm$') -- Strict regex match
);

-- Policy 2: Allow authenticated users to SELECT (view/download) all audio files
CREATE POLICY "view_all_audio"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'selection-audios');

-- Policy 3: Allow users to UPDATE their own files
CREATE POLICY "update_own_audio"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'selection-audios' AND
  name ~ ('^' || auth.uid()::text || '_alfath29_[0-9]+\.webm$')
)
WITH CHECK (
  bucket_id = 'selection-audios' AND
  name ~ ('^' || auth.uid()::text || '_alfath29_[0-9]+\.webm$')
);

-- Policy 4: Allow users to DELETE their own files
CREATE POLICY "delete_own_audio"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'selection-audios' AND
  name ~ ('^' || auth.uid()::text || '_alfath29_[0-9]+\.webm$')
);

-- Policy 5: Allow admin to DELETE any files (for moderation)
CREATE POLICY "admin_delete_any_audio"
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

-- Verify policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%audio%'
ORDER BY policyname;
