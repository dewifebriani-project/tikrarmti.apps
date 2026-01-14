-- Query yang SAMA PERSIS dengan API (dengan join ke halaqah)
SELECT
  ds.*,
  u.full_name,
  u.email,
  u.roles,
  -- Join ke halaqah (sama seperti di API)
  (SELECT id FROM halaqah WHERE id = ds.ujian_halaqah_id) as ujian_halaqah_id_check,
  (SELECT name FROM halaqah WHERE id = ds.ujian_halaqah_id) as ujian_halaqah_name_check,
  (SELECT id FROM halaqah WHERE id = ds.tashih_halaqah_id) as tashih_halaqah_id_check,
  (SELECT name FROM halaqah WHERE id = ds.tashih_halaqah_id) as tashih_halaqah_name_check
FROM daftar_ulang_submissions ds
JOIN users u ON u.id = ds.user_id
WHERE ds.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49'
  AND (
    ds.ujian_halaqah_id = '1dd5d92d-94d6-4d99-9a1d-298e2ee8bad9' 
    OR ds.tashih_halaqah_id = '1dd5d92d-94d6-4d99-9a1d-298e2ee8bad9'
  )
ORDER BY ds.created_at DESC;

-- Hitung jumlah thalibah per halaqah
SELECT
  'Halaqah Ustadzah Desi Lianata' as halaqah_name,
  COUNT(*) as total_thalibah,
  COUNT(CASE WHEN ds.status = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN ds.status = 'submitted' THEN 1 END) as submitted_count,
  COUNT(CASE WHEN ds.status = 'draft' THEN 1 END) as draft_count
FROM daftar_ulang_submissions ds
WHERE ds.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49'
  AND (
    ds.ujian_halaqah_id = '1dd5d92d-94d6-4d99-9a1d-298e2ee8bad9' 
    OR ds.tashih_halaqah_id = '1dd5d92d-94d6-4d99-9a1d-298e2ee8bad9'
  );
