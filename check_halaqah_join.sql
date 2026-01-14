-- Cek apakah halaqah join berhasil untuk Wahyu Suci
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
WHERE u.full_name = 'Wahyu Suci Fatriyanti';

-- Bandingkan dengan yang sudah muncul (Ira Mutmainah)
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
WHERE u.full_name = 'Ira Mutmainah';
