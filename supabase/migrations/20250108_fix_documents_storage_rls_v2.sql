-- Fix RLS policies for documents storage bucket
-- This migration allows authenticated users to upload akad files

-- Step 1: Ensure documents bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true, -- Public bucket for document access
  5242880, -- 5MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

-- Step 2: Drop ALL existing policies for documents bucket
DROP POLICY IF EXISTS "authenticated_can_upload_documents" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_can_view_documents" ON storage.objects;
DROP POLICY IF EXISTS "public_can_view_documents" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_can_update_documents" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_can_delete_documents" ON storage.objects;

-- Step 3: Create policies for documents bucket
-- Authenticated users can upload to their own folder
CREATE POLICY "authenticated_can_upload_documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can view their own files
CREATE POLICY "authenticated_can_view_documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public can view all documents (for akad verification by admin)
CREATE POLICY "public_can_view_documents"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'documents'
);

-- Authenticated users can update their own files
CREATE POLICY "authenticated_can_update_documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can delete their own files
CREATE POLICY "authenticated_can_delete_documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Step 4: Verify
SELECT
  id,
  name,
  public,
  file_size_limit
FROM storage.buckets
WHERE id = 'documents';

SELECT
  policyname,
  cmd,
  roles::text
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%documents%'
ORDER BY policyname;

COMMENT ON POLICY "authenticated_can_upload_documents" ON storage.objects IS 'Allows authenticated users to upload files to their own folder in documents bucket';
COMMENT ON POLICY "authenticated_can_view_documents" ON storage.objects IS 'Allows authenticated users to view their own files in documents bucket';
COMMENT ON POLICY "public_can_view_documents" ON storage.objects IS 'Allows public (including admin) to view all files in documents bucket';
COMMENT ON POLICY "authenticated_can_update_documents" ON storage.objects IS 'Allows authenticated users to update their own files in documents bucket';
COMMENT ON POLICY "authenticated_can_delete_documents" ON storage.objects IS 'Allows authenticated users to delete their own files in documents bucket';
