# Fix: Card Pendaftaran Tikrar Tahifdz Batch 2 Tidak Muncul di Dashboard

## 🔍 Masalah

Card pendaftaran **Tikrar Tahifdz Batch 2** muncul untuk **sebagian users** (admin) tapi **TIDAK muncul** untuk sebagian users lainnya (calon_thalibah, thalibah, dll) di halaman dashboard.

## 🎯 Root Cause

**Bukan masalah session, cookies, atau autentikasi!**

Masalahnya adalah **Row Level Security (RLS) Policy** pada tabel `batches` yang terlalu restrictive:

```sql
-- Policy yang bermasalah (hanya admin yang bisa SELECT)
CREATE POLICY "Admins can view all batches" ON public.batches
    FOR SELECT
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM public.users WHERE role = 'admin'
        )
    );
```

### Dampaknya:

- ✅ **Users dengan role `admin`** → Bisa query tabel `batches` → **Card MUNCUL**
- ❌ **Users dengan role lain** (`calon_thalibah`, `thalibah`, dll) → **TIDAK bisa** query tabel `batches` → **Card TIDAK MUNCUL**

### Penjelasan Teknis:

Di file `components/DashboardContent.tsx` line 109-114:

```typescript
const { data, error } = await supabase
  .from('batches')
  .select('*')
  .eq('status', 'open')
  .order('created_at', { ascending: false })
  .limit(1)
```

**Yang terjadi untuk user non-admin:**
1. Query ke tabel `batches` dijalankan
2. RLS policy memblokir akses karena user bukan admin
3. Query mengembalikan **empty array** `[]`
4. `batchInfo` tetap `null`
5. Kondisi `{batchInfo && (...)}` di line 367 → **Card TIDAK ditampilkan**

## ✅ Solusi

### Langkah 1: Cek Policy yang Aktif Saat Ini

Jalankan script ini di Supabase SQL Editor:

```bash
# Buka file ini di Supabase SQL Editor
scripts/check_current_batches_policies.sql
```

Atau copy-paste query ini:

```sql
SELECT
    policyname,
    cmd as command,
    qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'batches'
ORDER BY policyname;
```

### Langkah 2: Jalankan Script Fix

**File:** `scripts/fix_batches_rls_for_all_users.sql`

Jalankan di Supabase SQL Editor:

1. Buka Supabase Dashboard
2. Pilih project Anda
3. Klik **SQL Editor** di sidebar
4. Klik **New Query**
5. Copy isi file `scripts/fix_batches_rls_for_all_users.sql`
6. Paste dan klik **Run**

**Atau copy script ini:**

```sql
-- Fix RLS Policy untuk tabel batches
DROP POLICY IF EXISTS "Admins can view all batches" ON public.batches;
DROP POLICY IF EXISTS "Authenticated users can view batches" ON public.batches;

-- Allow ALL authenticated users to VIEW batches
CREATE POLICY "Authenticated users can view batches" ON public.batches
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Recreate admin-only policies for INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Admins can insert batches" ON public.batches;
DROP POLICY IF EXISTS "Admins can update batches" ON public.batches;
DROP POLICY IF EXISTS "Admins can delete batches" ON public.batches;

CREATE POLICY "Admins can insert batches" ON public.batches
    FOR INSERT
    WITH CHECK (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM public.users WHERE role = 'admin'
        )
    );

CREATE POLICY "Admins can update batches" ON public.batches
    FOR UPDATE
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM public.users WHERE role = 'admin'
        )
    );

CREATE POLICY "Admins can delete batches" ON public.batches
    FOR DELETE
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM public.users WHERE role = 'admin'
        )
    );

-- Verify RLS is enabled
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON public.batches TO authenticated;
```

### Langkah 3: Verify Fix

Setelah menjalankan script, verify dengan query ini:

```sql
-- Check policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'batches'
ORDER BY policyname;
```

**Expected result:**

| policyname | cmd | qual |
|-----------|-----|------|
| Admins can delete batches | DELETE | (auth.jwt() ->> 'email') IN (...) |
| Admins can insert batches | INSERT | - |
| Admins can update batches | UPDATE | (auth.jwt() ->> 'email') IN (...) |
| **Authenticated users can view batches** | **SELECT** | **auth.role() = 'authenticated'** |

### Langkah 4: Test

1. **Login sebagai user biasa** (non-admin)
2. **Buka halaman dashboard**
3. **Card "Pendaftaran Tikrar Tahifdz Batch 2 Dibuka!"** seharusnya **MUNCUL**

## 🔐 Security Impact

### Sebelum Fix:
- ❌ **SELECT**: Hanya admin
- ✅ **INSERT/UPDATE/DELETE**: Hanya admin

### Setelah Fix:
- ✅ **SELECT**: Semua authenticated users (aman, karena batch info adalah public data)
- ✅ **INSERT/UPDATE/DELETE**: Tetap hanya admin (secure)

**Kesimpulan:** Fix ini aman karena:
- Data batch adalah **informasi publik** yang seharusnya bisa dilihat semua users
- Operasi **modifikasi data** (INSERT/UPDATE/DELETE) tetap **restricted untuk admin**

## 📝 Files Yang Terlibat

### Scripts:
- `scripts/fix_batches_rls_for_all_users.sql` - Script untuk fix RLS policy
- `scripts/check_current_batches_policies.sql` - Script untuk cek policy aktif

### Code:
- `components/DashboardContent.tsx` (line 109-114) - Query batches
- `components/DashboardContent.tsx` (line 367-441) - Render card

## 🐛 Troubleshooting

### Issue: Error "policy already exists"

**Solusi:** Tambahkan `DROP POLICY IF EXISTS` sebelum `CREATE POLICY`

```sql
DROP POLICY IF EXISTS "Authenticated users can view batches" ON public.batches;
CREATE POLICY "Authenticated users can view batches" ON public.batches
    FOR SELECT
    USING (auth.role() = 'authenticated');
```

### Issue: Card masih tidak muncul setelah fix

**Checklist:**
1. ✅ Verify RLS policy sudah diupdate (lihat Langkah 3)
2. ✅ Clear cache browser (Ctrl+Shift+R)
3. ✅ Logout dan login ulang
4. ✅ Check console browser untuk error
5. ✅ Verify ada batch dengan status='open' di database:
   ```sql
   SELECT * FROM batches WHERE status = 'open';
   ```

### Issue: Admin juga tidak bisa lihat card

**Solusi:** Check apakah ada batch dengan status='open':

```sql
-- Check batches
SELECT id, name, status, start_date, end_date
FROM batches
ORDER BY created_at DESC;

-- Update status jika perlu
UPDATE batches
SET status = 'open'
WHERE name = 'Tikrar MTI Batch 2';
```

## ✅ Verification Checklist

- [ ] RLS policy "Authenticated users can view batches" sudah dibuat
- [ ] Query `SELECT * FROM batches WHERE status='open'` berhasil untuk user biasa
- [ ] Card muncul di dashboard untuk user non-admin
- [ ] Card muncul di dashboard untuk admin
- [ ] INSERT/UPDATE/DELETE batches masih restricted untuk admin only

## 📚 Related Documentation

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/sql-createpolicy.html)

---

**Status:** ✅ Fixed
**Date:** 2025-12-16
**Impact:** All authenticated users can now see batch registration cards
