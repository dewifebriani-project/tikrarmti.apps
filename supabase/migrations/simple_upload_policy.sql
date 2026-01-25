-- Simplified upload policy - remove all complex checks
-- This should definitely work if user is authenticated

-- Drop the complex upload policy
DROP POLICY IF EXISTS "upload_own_audio" ON storage.objects;

-- Create simple upload policy - just check bucket and user prefix
CREATE POLICY "upload_own_audio_simple"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'selection-audios' AND
  -- Simple prefix check - filename starts with user's UUID
  (name LIKE auth.uid()::text || '%')
);

-- Verify the new policy
SELECT
  policyname,
  cmd,
  roles::text,
  with_check::text as with_check_clause
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname = 'upload_own_audio_simple';

-- Test if it would allow the upload
-- Replace this UUID with the actual user UUID from your error
DO $$
DECLARE
  test_uuid text := 'c862c410-0bee-4ac6-a3ca-53ac5b97277c';
  test_filename text := 'c862c410-0bee-4ac6-a3ca-53ac5b97277c_alfath29_1766690345680.webm';
BEGIN
  -- Test the LIKE condition
  IF test_filename LIKE test_uuid || '%' THEN
    RAISE NOTICE 'Policy check PASSED: Filename % starts with UUID %', test_filename, test_uuid;
  ELSE
    RAISE NOTICE 'Policy check FAILED: Filename % does NOT start with UUID %', test_filename, test_uuid;
  END IF;
END $$;
