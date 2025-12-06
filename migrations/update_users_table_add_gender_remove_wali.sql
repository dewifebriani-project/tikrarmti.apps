-- Migration: Update users table - Add jenis_kelamin, remove wali fields
-- Created: 2025-12-06
-- Description: Menambahkan field jenis_kelamin dan menghapus field data wali yang tidak diperlukan

-- 1. Tambahkan kolom jenis_kelamin
ALTER TABLE users
ADD COLUMN IF NOT EXISTS jenis_kelamin VARCHAR(20);

-- 2. Tambahkan comment pada kolom jenis_kelamin
COMMENT ON COLUMN users.jenis_kelamin IS 'Jenis kelamin user (Perempuan/Laki-laki)';

-- 3. Hapus kolom-kolom data wali (jika ada)
ALTER TABLE users
DROP COLUMN IF EXISTS nama_wali,
DROP COLUMN IF EXISTS nomor_wali,
DROP COLUMN IF EXISTS hubungan_wali;

-- 4. Update constraint untuk field yang sekarang wajib (jika belum)
-- Pastikan field berikut NOT NULL
ALTER TABLE users
ALTER COLUMN tanggal_lahir SET NOT NULL,
ALTER COLUMN tempat_lahir SET NOT NULL,
ALTER COLUMN pekerjaan SET NOT NULL,
ALTER COLUMN alasan_daftar SET NOT NULL;

-- 5. Tambahkan check constraint untuk jenis_kelamin
ALTER TABLE users
ADD CONSTRAINT check_jenis_kelamin
CHECK (jenis_kelamin IN ('Perempuan', 'Laki-laki') OR jenis_kelamin IS NULL);

-- 6. Update existing records yang belum memiliki jenis_kelamin (opsional, bisa diisi manual)
-- Karena ini aplikasi MTI yang mayoritas perempuan, kita bisa set default untuk data lama
UPDATE users
SET jenis_kelamin = 'Perempuan'
WHERE jenis_kelamin IS NULL;

-- 7. Setelah update data lama, set jenis_kelamin menjadi NOT NULL
ALTER TABLE users
ALTER COLUMN jenis_kelamin SET NOT NULL;

-- Rollback instructions (jika diperlukan):
-- ALTER TABLE users DROP COLUMN IF EXISTS jenis_kelamin;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS nama_wali VARCHAR(255);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS nomor_wali VARCHAR(20);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS hubungan_wali VARCHAR(50);
-- ALTER TABLE users ALTER COLUMN tanggal_lahir DROP NOT NULL;
-- ALTER TABLE users ALTER COLUMN tempat_lahir DROP NOT NULL;
-- ALTER TABLE users ALTER COLUMN pekerjaan DROP NOT NULL;
-- ALTER TABLE users ALTER COLUMN alasan_daftar DROP NOT NULL;
