# Migration Instructions - Current Tikrar Batch Feature

## Overview
Menambahkan kolom `current_tikrar_batch_id` di tabel users untuk tracking batch tikrar yang sedang aktif.

## Step-by-Step Instructions

### Step 1: Run Migration (Add Column & Trigger)
Buka Supabase Dashboard → SQL Editor, lalu jalankan script ini:

**File:** `supabase/migrations/20251225_add_current_tikrar_batch_to_users.sql`

```sql
-- Migration: Add current_tikrar_batch_id to users table
-- Date: 2025-12-25
-- Description: Track which tikrar batch the user is currently enrolled in

-- Add column to store current tikrar batch
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS current_tikrar_batch_id uuid;

-- Add foreign key constraint (using Supabase naming convention)
ALTER TABLE public.users
ADD CONSTRAINT users_current_tikrar_batch_id_fkey
FOREIGN KEY (current_tikrar_batch_id)
REFERENCES public.batches(id)
ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_current_tikrar_batch
ON public.users(current_tikrar_batch_id);

-- Add comment
COMMENT ON COLUMN public.users.current_tikrar_batch_id IS
'Reference to the current active tikrar batch the user is enrolled in. Automatically updated when user registers or gets approved.';

-- Function to automatically set current_tikrar_batch when user is approved
CREATE OR REPLACE FUNCTION set_user_current_tikrar_batch()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if status changed to 'approved' or 'selected'
  IF (NEW.status = 'approved' OR NEW.selection_status = 'selected')
     AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.selection_status IS DISTINCT FROM NEW.selection_status) THEN

    -- Update user's current_tikrar_batch_id
    UPDATE public.users
    SET current_tikrar_batch_id = NEW.batch_id,
        updated_at = NOW()
    WHERE id = NEW.user_id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for pendaftaran_tikrar_tahfidz
DROP TRIGGER IF EXISTS trigger_set_user_tikrar_batch ON public.pendaftaran_tikrar_tahfidz;
CREATE TRIGGER trigger_set_user_tikrar_batch
AFTER UPDATE ON public.pendaftaran_tikrar_tahfidz
FOR EACH ROW
EXECUTE FUNCTION set_user_current_tikrar_batch();

-- Create view to easily get users with their current tikrar batch info
CREATE OR REPLACE VIEW v_users_with_tikrar_batch AS
SELECT
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.current_tikrar_batch_id,
  b.name as current_tikrar_batch_name,
  b.start_date as batch_start_date,
  b.end_date as batch_end_date,
  b.status as batch_status
FROM public.users u
LEFT JOIN public.batches b ON u.current_tikrar_batch_id = b.id;

COMMENT ON VIEW v_users_with_tikrar_batch IS
'View showing users with their current tikrar batch information';
```

Klik **"Run"** ✅

---

### Step 2: Populate Existing Data
Setelah Step 1 selesai, jalankan script ini untuk mengisi data users yang sudah ada:

**File:** `supabase/migrations/20251225_populate_current_tikrar_batch.sql`

```sql
-- Migration: Populate current_tikrar_batch_id for existing users
-- Date: 2025-12-25
-- Description: Set current_tikrar_batch_id for users who already have approved registrations

-- Update users with their current tikrar batch based on their latest approved/selected registration
UPDATE public.users u
SET current_tikrar_batch_id = subquery.batch_id,
    updated_at = NOW()
FROM (
  SELECT DISTINCT ON (user_id)
    user_id,
    batch_id
  FROM public.pendaftaran_tikrar_tahfidz
  WHERE (status = 'approved' OR selection_status = 'selected')
    AND user_id IS NOT NULL
    AND batch_id IS NOT NULL
  ORDER BY user_id, created_at DESC
) AS subquery
WHERE u.id = subquery.user_id;

-- Show results
SELECT
  u.id,
  u.email,
  u.full_name,
  u.current_tikrar_batch_id,
  b.name as batch_name,
  b.status as batch_status
FROM public.users u
LEFT JOIN public.batches b ON u.current_tikrar_batch_id = b.id
WHERE u.current_tikrar_batch_id IS NOT NULL
ORDER BY u.created_at DESC
LIMIT 20;
```

Klik **"Run"** ✅

Script ini akan:
- Set `current_tikrar_batch_id` untuk semua user yang sudah punya registrasi approved/selected
- Menampilkan 20 user pertama yang sudah di-update

---

### Step 3: Verify Results

Jalankan query ini untuk memverifikasi:

```sql
-- Check total users with batch
SELECT
  COUNT(*) as total_users_with_batch
FROM public.users
WHERE current_tikrar_batch_id IS NOT NULL;

-- Check sample data
SELECT
  u.email,
  u.full_name,
  b.name as batch_name,
  b.status as batch_status
FROM public.users u
JOIN public.batches b ON u.current_tikrar_batch_id = b.id
LIMIT 10;
```

---

### Step 4: Test in Admin Panel

1. Buka aplikasi
2. Login sebagai admin
3. Buka halaman Admin → Users
4. Kolom "Tikrar Batch" seharusnya sudah muncul dengan:
   - Badge nama batch (e.g., "Tikrar MTI Batch 2")
   - Warna hijau/biru/abu-abu sesuai status
   - Checkmark (✓) untuk batch aktif
   - Status seleksi

---

## Troubleshooting

### Jika kolom masih kosong:
```sql
-- Cek apakah ada registrasi yang approved
SELECT COUNT(*) FROM pendaftaran_tikrar_tahfidz
WHERE status = 'approved' OR selection_status = 'selected';

-- Manual set untuk satu user (ganti UUID)
UPDATE users
SET current_tikrar_batch_id = (
  SELECT batch_id FROM pendaftaran_tikrar_tahfidz
  WHERE user_id = 'user-uuid-here'
  AND (status = 'approved' OR selection_status = 'selected')
  ORDER BY created_at DESC
  LIMIT 1
)
WHERE id = 'user-uuid-here';
```

### Jika error foreign key:
```sql
-- Drop constraint lama jika ada
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_current_tikrar_batch;

-- Buat ulang dengan nama yang benar
ALTER TABLE users
ADD CONSTRAINT users_current_tikrar_batch_id_fkey
FOREIGN KEY (current_tikrar_batch_id)
REFERENCES batches(id)
ON DELETE SET NULL;
```

### Jika data tidak muncul di frontend:
1. Clear browser cache
2. Refresh halaman admin
3. Check console untuk errors
4. Verify API response di Network tab

---

## Expected Results

Setelah migration berhasil, di admin panel akan muncul:

```
📗 Tikrar MTI Batch 2 ✓
✅ Diterima
```

Dengan warna:
- 🟢 Hijau = Batch open
- 🔵 Biru = Batch ongoing
- ⚫ Abu-abu = Batch closed
- ✓ = Batch aktif saat ini

---

## Notes

- Kolom ini **opsional** - user tanpa registrasi akan tampil "-"
- Trigger otomatis update saat ada approve baru
- Data dinamis berdasarkan batch yang sedang open/ongoing
- Tidak perlu ubah kode saat buka batch baru
