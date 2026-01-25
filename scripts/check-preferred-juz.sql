-- Check preferred_juz values in halaqah table
SELECT
  h.id,
  h.name,
  h.preferred_juz,
  h.max_students,
  h.status
FROM public.halaqah h
INNER JOIN public.programs p ON p.id = h.program_id
WHERE p.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49'::UUID
  AND h.status = 'active'
ORDER BY h.name;

-- Count how many have NULL vs non-NULL preferred_juz
SELECT
  COUNT(*) FILTER (WHERE h.preferred_juz IS NULL) as null_preferred_juz,
  COUNT(*) FILTER (WHERE h.preferred_juz IS NOT NULL) as not_null_preferred_juz,
  COUNT(*) as total_halaqah
FROM public.halaqah h
INNER JOIN public.programs p ON p.id = h.program_id
WHERE p.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49'::UUID
  AND h.status = 'active';
