-- FINAL FIX: Make storage accessible with proper public access
-- The issue is that client uses ANON key, not authenticated context

-- Step 1: Ensure bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'selection-audios',
  'selection-audios',
  true, -- MUST be public for direct uploads
  10485760,
  ARRAY['audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav'];

-- Step 2: Drop ALL existing policies
DROP POLICY IF EXISTS "authenticated_can_upload" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_can_view" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_can_update" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_can_delete" ON storage.objects;

-- Step 3: Create PUBLIC policies (works with anon key)
-- PUBLIC role is what browser clients use!

CREATE POLICY "public_can_upload_audio"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'selection-audios'
);

CREATE POLICY "public_can_view_audio"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'selection-audios'
);

CREATE POLICY "public_can_update_audio"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'selection-audios')
WITH CHECK (bucket_id = 'selection-audios');

CREATE POLICY "public_can_delete_audio"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'selection-audios');

-- Step 4: Verify
SELECT
  id,
  name,
  public,
  file_size_limit
FROM storage.buckets
WHERE id = 'selection-audios';

SELECT
  policyname,
  cmd,
  roles::text
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%audio%'
ORDER BY policyname;
