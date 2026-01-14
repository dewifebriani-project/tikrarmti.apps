-- Cek semua user dengan nama mengandung 'Wahyu' atau 'Suci'
SELECT
  id,
  full_name,
  email,
  roles
FROM users
WHERE full_name ILIKE '%Wahyu%' OR full_name ILIKE '%Suci%'
ORDER BY full_name;

-- Cek submissions untuk user dengan nama mengandung 'Wahyu' atau 'Suci'
SELECT
  ds.id,
  ds.user_id,
  u.full_name,
  ds.status,
  ds.ujian_halaqah_id,
  ds.tashih_halaqah_id,
  ds.batch_id,
  (SELECT name FROM halaqah WHERE id = ds.ujian_halaqah_id) as ujian_halaqah_name,
  (SELECT name FROM halaqah WHERE id = ds.tashih_halaqah_id) as tashih_halaqah_name
FROM daftar_ulang_submissions ds
JOIN users u ON u.id = ds.user_id
WHERE u.full_name ILIKE '%Wahyu%' OR u.full_name ILIKE '%Suci%'
ORDER BY u.full_name;
