-- Tambahkan role 'calon_thalibah' untuk Dewi Nurhayati dan Wahyu Suci Fatriyanti
-- Mereka akan memiliki role 'admin' dan 'calon_thalibah' (multi-role)

-- Cek struktur table user_roles terlebih dahulu
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_roles'
ORDER BY ordinal_position;

-- Jika menggunakan array/text untuk roles di users table
UPDATE users
SET role = role || ',calon_thalibah'
WHERE full_name IN ('Dewi Nurhayati', 'Wahyu Suci Fatriyanti')
AND role NOT LIKE '%calon_thalibah%';

-- Atau jika menggunakan table user_roles (many-to-many)
-- Hapus komentar di bawah ini jika ada table user_roles

-- INSERT INTO user_roles (user_id, role)
-- SELECT id, 'calon_thalibah'
-- FROM users
-- WHERE full_name IN ('Dewi Nurhayati', 'Wahyu Suci Fatriyanti')
-- AND NOT EXISTS (
--   SELECT 1 FROM user_roles ur
--   WHERE ur.user_id = users.id
--   AND ur.role = 'calon_thalibah'
-- );

-- Verifikasi hasil
SELECT id, full_name, email, role
FROM users
WHERE full_name IN ('Dewi Nurhayati', 'Wahyu Suci Fatriyanti', 'Ira Mutmainah', 'Rina Mayang Sari')
ORDER BY full_name;
