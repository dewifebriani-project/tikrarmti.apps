-- Query yang SAMA persis dengan yang dipakai API
-- Dengan select untuk join ke halaqah
SELECT
  ds.id,
  ds.user_id,
  ds.status,
  ds.batch_id,
  ds.ujian_halaqah_id,
  ds.tashih_halaqah_id,
  -- Cek apakah join berhasil
  (SELECT ROW_TO_JSON(h) FROM halaqah h WHERE h.id = ds.ujian_halaqah_id) as ujian_halaqah_obj,
  (SELECT ROW_TO_JSON(h) FROM halaqah h WHERE h.id = ds.tashih_halaqah_id) as tashih_halaqah_obj
FROM daftar_ulang_submissions ds
WHERE ds.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49'
  AND ds.user_id = 'd52d0ed1-a08e-4a78-8d92-251145bb7d9d'
ORDER BY ds.created_at DESC;
