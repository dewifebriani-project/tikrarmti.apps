-- Ambil sample 5 approved yang mungkin muncul (dengan halaqah_id)
SELECT
  'APPROVED Sample' as category,
  ds.id,
  ds.user_id,
  u.full_name,
  ds.status,
  ds.ujian_halaqah_id,
  ds.tashih_halaqah_id,
  ds.batch_id,
  (SELECT name FROM halaqah WHERE id = ds.ujian_halaqah_id) as ujian_halaqah_name,
  (SELECT name FROM halaqah WHERE id = ds.tashih_halaqah_id) as tashih_halaqah_name,
  (SELECT id FROM halaqah WHERE id = ds.ujian_halaqah_id) as halaqah_exists
FROM daftar_ulang_submissions ds
JOIN users u ON u.id = ds.user_id
WHERE ds.status = 'approved'
  AND ds.ujian_halaqah_id IS NOT NULL
LIMIT 5;

-- Ambil sample 5 submitted yang punya halaqah_id
SELECT
  'SUBMITTED Sample' as category,
  ds.id,
  ds.user_id,
  u.full_name,
  ds.status,
  ds.ujian_halaqah_id,
  ds.tashih_halaqah_id,
  ds.batch_id,
  (SELECT name FROM halaqah WHERE id = ds.ujian_halaqah_id) as ujian_halaqah_name,
  (SELECT name FROM halaqah WHERE id = ds.tashih_halaqah_id) as tashih_halaqah_name,
  (SELECT id FROM halaqah WHERE id = ds.ujian_halaqah_id) as halaqah_exists
FROM daftar_ulang_submissions ds
JOIN users u ON u.id = ds.user_id
WHERE ds.status = 'submitted'
  AND ds.ujian_halaqah_id IS NOT NULL
LIMIT 5;

-- Cek apakah ada perbedaan di halaqah data
SELECT
  h.id as halaqah_id,
  h.name as halaqah_name,
  COUNT(DISTINCT CASE WHEN ds.status = 'approved' THEN ds.user_id END) as approved_count,
  COUNT(DISTINCT CASE WHEN ds.status = 'submitted' THEN ds.user_id END) as submitted_count,
  COUNT(DISTINCT ds.user_id) as total_count
FROM halaqah h
JOIN daftar_ulang_submissions ds ON (ds.ujian_halaqah_id = h.id OR ds.tashih_halaqah_id = h.id)
WHERE ds.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49'
GROUP BY h.id, h.name
ORDER BY total_count DESC
LIMIT 10;
