-- Diagnosa masalah timeline perjalanan-saya
-- Cek batch dan user yang terdaftar

-- 1. Lihat semua batch dengan timeline completeness
SELECT
  id,
  name,
  status,
  -- Registration dates
  registration_start_date IS NOT NULL as has_registration,
  -- Timeline dates
  selection_start_date IS NOT NULL as has_selection,
  re_enrollment_date IS NOT NULL as has_re_enrollment,
  opening_class_date IS NOT NULL as has_opening,
  first_week_start_date IS NOT NULL as has_first_week,
  review_week_start_date IS NOT NULL as has_review,
  final_exam_start_date IS NOT NULL as has_final_exam,
  graduation_start_date IS NOT NULL as has_graduation,
  -- Count how many timeline dates are set
  (
    (registration_start_date IS NOT NULL)::int +
    (selection_start_date IS NOT NULL)::int +
    (re_enrollment_date IS NOT NULL)::int +
    (opening_class_date IS NOT NULL)::int +
    (first_week_start_date IS NOT NULL)::int +
    (review_week_start_date IS NOT NULL)::int +
    (final_exam_start_date IS NOT NULL)::int +
    (graduation_start_date IS NOT NULL)::int
  ) as timeline_completeness
FROM public.batches
ORDER BY created_at DESC;

-- 2. Cek user yang terdaftar dan batch mereka
SELECT
  u.id as user_id,
  u.email,
  u.full_name,
  pt.id as registration_id,
  pt.status as registration_status,
  pt.selection_status,
  pt.created_at as registration_date,
  b.id as batch_id,
  b.name as batch_name,
  b.status as batch_status,
  -- Check if batch has ANY timeline dates
  (
    b.registration_start_date IS NOT NULL OR
    b.re_enrollment_date IS NOT NULL OR
    b.opening_class_date IS NOT NULL
  ) as has_timeline_dates
FROM public.users u
INNER JOIN public.pendaftaran_tikrar_tahfidz pt ON pt.user_id = u.id
LEFT JOIN public.batches b ON b.id = pt.batch_id
ORDER BY pt.created_at DESC;

-- 3. Cek spesifik: user dengan batch yang TIDAK memiliki timeline
SELECT
  u.id as user_id,
  u.email,
  u.full_name,
  pt.id as registration_id,
  pt.status as registration_status,
  b.id as batch_id,
  b.name as batch_name,
  'TIDAK memiliki timeline dates' as issue
FROM public.users u
INNER JOIN public.pendaftaran_tikrar_tahfidz pt ON pt.user_id = u.id
LEFT JOIN public.batches b ON b.id = pt.batch_id
WHERE
  b.registration_start_date IS NULL AND
  b.re_enrollment_date IS NULL AND
  b.opening_class_date IS NULL;
