-- Cek apakah Dewi ada di batch yang berbeda
SELECT
  ds.id,
  ds.user_id,
  u.full_name,
  ds.status,
  ds.batch_id,
  b.name as batch_name,
  b.created_at as batch_created,
  ds.ujian_halaqah_id,
  (SELECT name FROM halaqah WHERE id = ds.ujian_halaqah_id) as halaqah_name
FROM daftar_ulang_submissions ds
JOIN users u ON u.id = ds.user_id
LEFT JOIN batches b ON b.id = ds.batch_id
WHERE u.full_name = 'Dewi Nurhayati'
ORDER BY ds.created_at DESC;

-- Cek semua batches
SELECT id, name, created_at FROM batches ORDER BY created_at DESC;

-- Cek batch mana yang paling banyak datanya
SELECT 
  ds.batch_id,
  b.name,
  COUNT(*) as count
FROM daftar_ulang_submissions ds
LEFT JOIN batches b ON b.id = ds.batch_id
GROUP BY ds.batch_id, b.name
ORDER BY count DESC;
