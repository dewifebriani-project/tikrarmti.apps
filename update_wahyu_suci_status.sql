-- Update status Wahyu Suci Fatriyanti menjadi approved
UPDATE daftar_ulang_submissions
SET status = 'approved',
    updated_at = NOW()
WHERE user_id = 'd52d0ed1-a08e-4a78-8d92-251145bb7d9d'
  AND id = '8a1e538b-9dc2-472b-8c1d-76a6f7cee6d6';

-- Verifikasi hasil
SELECT
  ds.id,
  ds.user_id,
  u.full_name,
  ds.status,
  ds.ujian_halaqah_id,
  ds.tashih_halaqah_id,
  ds.batch_id,
  u.roles
FROM daftar_ulang_submissions ds
JOIN users u ON u.id = ds.user_id
WHERE u.full_name = 'Wahyu Suci Fatriyanti';
