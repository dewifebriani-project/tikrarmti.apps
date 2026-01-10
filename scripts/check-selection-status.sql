-- Check if selection_status column exists in pendaftaran_tikrar_tahfidz
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'pendaftaran_tikrar_tahfidz'
  AND column_name = 'selection_status';

-- Check sample data with selection_status
SELECT 
  user_id,
  status,
  selection_status,
  chosen_juz,
  exam_score
FROM pendaftaran_tikrar_tahfidz
LIMIT 10;

-- Count by selection_status
SELECT 
  selection_status,
  COUNT(*) as count
FROM pendaftaran_tikrar_tahfidz
GROUP BY selection_status
ORDER BY selection_status;
