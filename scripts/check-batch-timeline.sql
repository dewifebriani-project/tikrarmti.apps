-- Check batch timeline dates for debugging perjalanan-saya page
-- Run this in Supabase SQL Editor to verify batch data

SELECT
  id,
  name,
  status,
  registration_start_date,
  registration_end_date,
  selection_start_date,
  selection_end_date,
  selection_result_date,
  re_enrollment_date,
  opening_class_date,
  first_week_start_date,
  first_week_end_date,
  review_week_start_date,
  review_week_end_date,
  final_exam_start_date,
  final_exam_end_date,
  graduation_start_date,
  graduation_end_date
FROM public.batches
ORDER BY created_at DESC;

-- Count how many batches have timeline dates set
SELECT
  COUNT(*) as total_batches,
  COUNT(registration_start_date) as has_reg_start,
  COUNT(selection_start_date) as has_selection_start,
  COUNT(re_enrollment_date) as has_re_enrollment,
  COUNT(opening_class_date) as has_opening_class,
  COUNT(first_week_start_date) as has_first_week,
  COUNT(review_week_start_date) as has_review_week,
  COUNT(final_exam_start_date) as has_final_exam,
  COUNT(graduation_start_date) as has_graduation
FROM public.batches;
