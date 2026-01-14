-- Cek total data per status di batch ini
SELECT
  ds.status,
  COUNT(*) as count,
  COUNT(CASE WHEN ds.ujian_halaqah_id IS NOT NULL OR ds.tashih_halaqah_id IS NOT NULL THEN 1 END) as with_halaqah
FROM daftar_ulang_submissions ds
WHERE ds.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49'
GROUP BY ds.status
ORDER BY ds.status;

-- Total semua
SELECT
  COUNT(*) as total_all,
  COUNT(CASE WHEN ds.ujian_halaqah_id IS NOT NULL OR ds.tashih_halaqah_id IS NOT NULL THEN 1 END) as total_with_halaqah
FROM daftar_ulang_submissions ds
WHERE ds.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49';

-- Cek 100 data pertama (yang diambil API)
SELECT
  ds.status,
  COUNT(*) as count
FROM daftar_ulang_submissions ds
WHERE ds.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49'
ORDER BY ds.created_at DESC
LIMIT 100
GROUP BY ds.status;
