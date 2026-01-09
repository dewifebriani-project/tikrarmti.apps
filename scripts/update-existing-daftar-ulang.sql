-- Script untuk mengupdate re_enrollment_completed menjadi true
-- untuk user yang sudah submit daftar ulang sebelum perbaikan kode

-- Update pendaftaran_tikrar_tahfidz untuk user yang sudah submit daftar ulang
UPDATE public.pendaftaran_tikrar_tahfidz pt
SET
  re_enrollment_completed = true,
  re_enrollment_completed_at = dus.submitted_at
FROM public.daftar_ulang_submissions dus
WHERE pt.id = dus.registration_id
  AND dus.status = 'submitted'
  AND pt.re_enrollment_completed = false;

-- Tampilkan hasil update
SELECT
  pt.id,
  pt.full_name,
  pt.re_enrollment_completed,
  pt.re_enrollment_completed_at,
  dus.status as daftar_ulang_status,
  dus.submitted_at as daftar_ulang_submitted_at
FROM public.pendaftaran_tikrar_tahfidz pt
INNER JOIN public.daftar_ulang_submissions dus ON pt.id = dus.registration_id
WHERE dus.status = 'submitted'
ORDER BY dus.submitted_at DESC;
