-- ===================================================================
-- MANUAL SQL SCRIPT - ADD NAMA_KUNYAH COLUMN TO USERS TABLE
-- ===================================================================
-- Instruksi:
-- 1. Login ke Supabase Dashboard (https://supabase.com)
-- 2. Pilih project Anda
-- 3. Buka "SQL Editor" dari menu kiri
-- 4. Klik "New Query"
-- 5. Copy-paste seluruh script ini
-- 6. Klik "Run" untuk mengeksekusi
-- ===================================================================

-- Step 1: Add nama_kunyah column if not exists
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS nama_kunyah TEXT NULL;

-- Step 2: Add comment to explain the column
COMMENT ON COLUMN public.users.nama_kunyah IS 'Nama kunyah/panggilan user (optional)';

-- Step 3: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_nama_kunyah
ON public.users USING btree (nama_kunyah)
TABLESPACE pg_default;

-- Step 4: Verify the column was added successfully
-- This will show the column details
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name = 'nama_kunyah';

-- Step 5: (Optional) Test by updating a sample user
-- Uncomment the lines below and replace 'your-user-id' with an actual user ID
-- UPDATE public.users
-- SET nama_kunyah = 'Test Kunyah'
-- WHERE id = 'your-user-id';

-- Step 6: Verify the update
-- Uncomment to see users with nama_kunyah
-- SELECT id, full_name, nama_kunyah, email
-- FROM public.users
-- WHERE nama_kunyah IS NOT NULL
-- LIMIT 5;

-- ===================================================================
-- SELESAI!
-- ===================================================================
-- Setelah menjalankan script ini:
-- 1. Refresh halaman admin di aplikasi
-- 2. Edit user dan coba isi field "Nama Kunyah/Panggilan"
-- 3. Save dan lihat hasilnya di tabel users
-- ===================================================================
