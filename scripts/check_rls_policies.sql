-- Cek apakah RLS policies sudah benar untuk daftar_ulang_submissions

-- 1. Cek policies yang ada saat ini
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
WHERE tablename = 'daftar_ulang_submissions'
ORDER BY policyname;

-- 2. Cek apakah user bisa membaca data mereka sendiri
-- Login sebagai vivi dan jalankan:
SELECT
  id,
  user_id,
  registration_id,
  status
FROM daftar_ulang_submissions
WHERE user_id = '902b0145-14b1-4d18-9553-0cf7372112bf';

-- 3. Cek auth.uid() untuk user vivi
SELECT
  auth.uid() as current_user_id,
  id,
  user_id,
  registration_id,
  status
FROM daftar_ulang_submissions
WHERE user_id = '902b0145-14b1-4d18-9553-0cf7372112bf';
