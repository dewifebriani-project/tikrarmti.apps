-- Test the analyze_halaqah_availability_by_juz function
-- This will help identify any remaining issues

-- First, check if the function exists
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'analyze_halaqah_availability_by_juz';

-- Test the function with the batch ID
SELECT * FROM analyze_halaqah_availability_by_juz('4bcb3020-20cb-46e2-8be4-0100f8012a49'::UUID);

-- If the above fails, check what's in the halaqah table
SELECT
  h.id,
  h.name,
  h.preferred_juz,
  h.max_students,
  h.status,
  p.id as program_id,
  p.batch_id
FROM public.halaqah h
INNER JOIN public.programs p ON p.id = h.program_id
WHERE p.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49'::UUID
ORDER BY h.name;

-- Check juz_options
SELECT
  jo.code,
  jo.juz_number,
  jo.name,
  jo.is_active
FROM public.juz_options jo
WHERE jo.juz_number IN (28, 29, 30)
ORDER BY jo.juz_number, jo.part;

-- Check pendaftaran_tikrar_tahfidz data
SELECT
  pt.chosen_juz,
  pt.selection_status,
  COUNT(DISTINCT pt.user_id) as count
FROM public.pendaftaran_tikrar_tahfidz pt
WHERE pt.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49'::UUID
GROUP BY pt.chosen_juz, pt.selection_status
ORDER BY pt.chosen_juz;
