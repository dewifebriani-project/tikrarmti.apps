-- Tambahkan role 'calon_thalibah' untuk Dewi Nurhayati dan Wahyu Suci Fatriyanti
-- Mereka akan memiliki multi-role: admin, calon_thalibah, (dan muallimah untuk Wahyu Suci)

-- CEK DULU struktur role di table users
SELECT full_name, role FROM users
WHERE full_name IN ('Dewi Nurhayati', 'Wahyu Suci Fatriyanti', 'Ira Mutmainah', 'Rina Mayang Sari')
ORDER BY full_name;

-- ============================================
-- OPSI 1: Jika role disimpan sebagai comma-separated string
-- ============================================

-- Untuk Dewi Nurhayati (admin -> admin,calon_thalibah)
UPDATE users
SET role = 'admin,calon_thalibah'
WHERE full_name = 'Dewi Nurhayati'
AND role = 'admin';

-- Untuk Wahyu Suci Fatriyanti (admin -> admin,calon_thalibah,muallimah)
-- Atau jika dia sudah muallimah, tambahkan calon_thalibah
UPDATE users
SET role = CASE
  WHEN role = 'admin' THEN 'admin,calon_thalibah,muallimah'
  WHEN role = 'admin,muallimah' THEN 'admin,calon_thalibah,muallimah'
  WHEN role LIKE '%calon_thalibah%' THEN role
  ELSE 'admin,calon_thalibah,muallimah'
END
WHERE full_name = 'Wahyu Suci Fatriyanti';

-- ============================================
-- OPSI 2: Jika menggunakan array di PostgreSQL
-- ============================================

-- Uncomment jika role adalah array/text[]
-- UPDATE users
-- SET role = array_append(role, 'calon_thalibah')
-- WHERE full_name IN ('Dewi Nurhayati', 'Wahyu Suci Fatriyanti')
-- AND 'calon_thalibah' = ANY(role) IS FALSE;

-- ============================================
-- OPSI 3: Jika menggunakan table user_roles (many-to-many)
-- ============================================

-- Uncomment jika ada table user_roles
-- INSERT INTO user_roles (user_id, role)
-- SELECT id, 'calon_thalibah'
-- FROM users
-- WHERE full_name IN ('Dewi Nurhayati', 'Wahyu Suci Fatriyanti')
-- ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================
-- VERIFIKASI HASIL
-- ============================================

SELECT id, full_name, email, role
FROM users
WHERE full_name IN ('Dewi Nurhayati', 'Wahyu Suci Fatriyanti', 'Ira Mutmainah', 'Rina Mayang Sari')
ORDER BY full_name;

-- ============================================
-- QUERY UNTUK MENGECEK APAKAH ROLE SUDAH BENAR
-- ============================================

-- Cek apakah ada role calon_thalibah di data mereka
SELECT
  id,
  full_name,
  role,
  CASE
    WHEN role LIKE '%calon_thalibah%' THEN 'YES'
    ELSE 'NO'
  END as has_calon_thalibah_role
FROM users
WHERE full_name IN ('Dewi Nurhayati', 'Wahyu Suci Fatriyanti');
