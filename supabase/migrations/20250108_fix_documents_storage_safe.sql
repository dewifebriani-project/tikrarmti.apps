-- Fix RLS policies for documents storage bucket
-- Follow the same pattern as selection-audios which is working

-- Step 1: Try to create/update bucket (will fail if not owner, but that's OK)
DO $$
BEGIN
  -- Drop old policies if they exist
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

-- Step 2: Create policies following selection-audios pattern (TO public)

-- Public can upload (will be restricted by RLS at app level)
DO $$
BEGIN
  CREATE POLICY "public_can_upload_documents"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'documents');
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy "public_can_upload_documents" already exists';
END $$;

-- Public can view all documents
DO $$
BEGIN
  CREATE POLICY "public_can_view_documents"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'documents');
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy "public_can_view_documents" already exists';
END $$;

-- Public can update documents
DO $$
BEGIN
  CREATE POLICY "public_can_update_documents"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'documents')
  WITH CHECK (bucket_id = 'documents');
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy "public_can_update_documents" already exists';
END $$;

-- Public can delete documents
DO $$
BEGIN
  CREATE POLICY "public_can_delete_documents"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'documents');
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy "public_can_delete_documents" already exists';
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
