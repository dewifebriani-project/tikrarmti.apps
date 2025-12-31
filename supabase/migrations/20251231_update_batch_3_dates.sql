-- Update Batch 3 (Tikrar Tahfidz MTI Batch 3) with proper timeline dates
-- This migration sets the re_enrollment_date and other important dates

-- First, let's check the current batch
-- SELECT id, name, re_enrollment_date, opening_class_date FROM batches WHERE name LIKE '%Batch 3%';

-- Update Batch 3 with timeline dates based on the registration period (December 2024 - January 2025)
-- Assuming Batch 3 is the active batch that needs dates updated
UPDATE batches
SET
  -- Selection period: after registration ends
  selection_start_date = '2025-01-01',
  selection_end_date = '2025-01-14',

  -- Selection result announcement: 2 days after selection ends
  selection_result_date = '2025-01-16',

  -- Re-enrollment: 1 day after selection result
  re_enrollment_date = '2026-01-01',

  -- Opening class: 4 days after re-enrollment
  opening_class_date = '2026-01-05',

  -- First week (Tashih): 1 week after opening class
  first_week_start_date = '2026-01-12',
  first_week_end_date = '2026-01-18',

  -- Main learning period (10 weeks): from week 2 to week 11
  -- Week 2 starts the day after first week ends
  -- Week 11 ends 10 weeks later
  -- review_week_start_date will be calculated as first_week_end_date + 1 day + 10 weeks
  review_week_start_date = '2026-03-30',
  review_week_end_date = '2026-04-05',

  -- Final exam: 1 week after review week
  final_exam_start_date = '2026-04-06',
  final_exam_end_date = '2026-04-12',

  -- Graduation: 1 week after final exam
  graduation_start_date = '2026-04-13',
  graduation_end_date = '2026-04-19'
WHERE
  name = 'Tikrar Tahfidz MTI Batch 3'
  OR id = '2478b493-1b6b-412a-a05f-6193db815a43';

-- Verify the update
SELECT
  id,
  name,
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
FROM batches
WHERE name = 'Tikrar Tahfidz MTI Batch 3';
