-- Fix RLS policies for documents storage bucket
-- Alternative approach: Create new bucket-specific policies
-- NOTE: This migration uses DO blocks to handle policy creation safely

-- Step 1: Try to create/update bucket (will fail if not owner, but that's OK)
DO $$
BEGIN
  -- Drop old policies if they exist (ignore errors)
  DROP POLICY IF EXISTS "authenticated_can_upload_documents" ON storage.objects;
  DROP POLICY IF EXISTS "authenticated_can_view_documents" ON storage.objects;
  DROP POLICY IF EXISTS "public_can_view_documents" ON storage.objects;
  DROP POLICY IF EXISTS "authenticated_can_update_documents" ON storage.objects;
  DROP POLICY IF EXISTS "authenticated_can_delete_documents" ON storage.objects;

  -- Insert or update bucket (may fail if not owner)
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'documents',
    'documents',
    true,
    5242880,
    ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
  )
  ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create/update bucket: %', SQLERRM;
END $$;

-- Step 2: Create policies for documents bucket using DO blocks for safety

-- Authenticated users can upload to their own folder
DO $$
BEGIN
  CREATE POLICY "authenticated_can_upload_documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy "authenticated_can_upload_documents" already exists';
END $$;

-- Authenticated users can view their own files
DO $$
BEGIN
  CREATE POLICY "authenticated_can_view_documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy "authenticated_can_view_documents" already exists';
END $$;

-- Public can view all documents (for akad verification by admin)
DO $$
BEGIN
  CREATE POLICY "public_can_view_documents"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'documents'
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy "public_can_view_documents" already exists';
END $$;

-- Authenticated users can update their own files
DO $$
BEGIN
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
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy "authenticated_can_update_documents" already exists';
END $$;

-- Authenticated users can delete their own files
DO $$
BEGIN
  CREATE POLICY "authenticated_can_delete_documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy "authenticated_can_delete_documents" already exists';
END $$;

-- Step 3: Verification queries
SELECT
  'Bucket Info' as info_type,
  id,
  name,
  public,
  file_size_limit
FROM storage.buckets
WHERE id = 'documents';

SELECT
  'Policy Info' as info_type,
  policyname,
  cmd,
  roles::text
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%documents%'
ORDER BY policyname;
