-- Debug script untuk troubleshoot RLS issue
-- Jalankan ini di SQL Editor untuk cek masalahnya

-- 1. Check apakah user ada di table users
SELECT
  id,
  email,
  role,
  created_at
FROM public.users
WHERE id = 'c862c410-0bee-4ac6-a3ca-53ac5b97277c'::uuid;

-- 2. Check apakah user punya record di pendaftaran_tikrar_tahfidz
SELECT
  id,
  user_id,
  batch_id,
  program_id,
  full_name,
  oral_submission_url,
  oral_submitted_at,
  created_at
FROM public.pendaftaran_tikrar_tahfidz
WHERE user_id = 'c862c410-0bee-4ac6-a3ca-53ac5b97277c'::uuid;

-- 3. Test regex pattern dengan UUID
SELECT
  'c862c410-0bee-4ac6-a3ca-53ac5b97277c_alfath29_1766690345680.webm' ~
  ('^' || 'c862c410-0bee-4ac6-a3ca-53ac5b97277c'::text || '_alfath29_[0-9]+\.webm$')
  AS regex_match_result;

-- 4. Check current auth context
SELECT
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- 5. Simulate policy check manually
SELECT
  'selection-audios' = 'selection-audios' AS bucket_check,
  (storage.foldername(ARRAY['c862c410-0bee-4ac6-a3ca-53ac5b97277c_alfath29_1766690345680.webm']))[1] = '' AS folder_check,
  'c862c410-0bee-4ac6-a3ca-53ac5b97277c_alfath29_1766690345680.webm' ~
    ('^' || auth.uid()::text || '_alfath29_[0-9]+\.webm$') AS name_check;

-- 6. List all policies untuk selection-audios
SELECT
  policyname,
  cmd,
  roles::text,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%audio%'
ORDER BY cmd, policyname;
