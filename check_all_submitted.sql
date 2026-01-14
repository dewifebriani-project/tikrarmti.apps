-- Cek SEMUA submission dengan status submitted yang punya halaqah_id
SELECT
  ds.id,
  ds.user_id,
  u.full_name,
  ds.status,
  ds.ujian_halaqah_id,
  ds.tashih_halaqah_id,
  ds.batch_id,
  -- Cek halaqah data
  (SELECT id FROM halaqah WHERE id = ds.ujian_halaqah_id) as ujian_halaqah_exists,
  (SELECT name FROM halaqah WHERE id = ds.ujian_halaqah_id) as ujian_halaqah_name,
  (SELECT id FROM halaqah WHERE id = ds.tashih_halaqah_id) as tashih_halaqah_exists,
  (SELECT name FROM halaqah WHERE id = ds.tashih_halaqah_id) as tashih_halaqah_name
FROM daftar_ulang_submissions ds
JOIN users u ON u.id = ds.user_id
WHERE ds.status = 'submitted'
  AND (ds.ujian_halaqah_id IS NOT NULL OR ds.tashih_halaqah_id IS NOT NULL)
ORDER BY u.full_name;

-- Summary count
SELECT
  COUNT(*) as total_submitted_with_halaqah,
  COUNT(CASE WHEN ds.ujian_halaqah_id IS NOT NULL THEN 1 END) as has_ujian_halaqah,
  COUNT(CASE WHEN ds.tashih_halaqah_id IS NOT NULL THEN 1 END) as has_tashih_halaqah
FROM daftar_ulang_submissions ds
WHERE ds.status = 'submitted'
  AND (ds.ujian_halaqah_id IS NOT NULL OR ds.tashih_halaqah_id IS NOT NULL);
