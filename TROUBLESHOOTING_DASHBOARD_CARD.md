# Troubleshooting: Card Pendaftaran Tidak Muncul di Dashboard

## 📋 Ringkasan Masalah

Card "Pendaftaran Tikrar Tahifdz Batch 2" muncul untuk **sebagian users** tapi **tidak muncul** untuk sebagian users lainnya.

## ✅ Status Saat Ini

Berdasarkan investigasi:

1. **RLS Policy SUDAH BENAR** ✅
   - Policy `batches_select_all` sudah mengizinkan semua authenticated users untuk SELECT
   - Bukan masalah permission/security

2. **Code sudah ditambahkan logging** ✅
   - Logging detail sudah ditambahkan di `components/DashboardContent.tsx`
   - Akan membantu debug masalah di browser console

## 🔍 Langkah Troubleshooting

### STEP 1: Cek Database - Apakah ada batch dengan status 'open'?

Jalankan di **Supabase SQL Editor**:

```sql
SELECT id, name, status, start_date, end_date
FROM batches
WHERE status = 'open'
ORDER BY created_at DESC;
```

**Expected:** Harus ada minimal 1 row dengan nama seperti "Tikrar MTI Batch 2"

**Jika TIDAK ADA hasil:**
```sql
-- Update batch menjadi 'open'
UPDATE batches
SET status = 'open'
WHERE name ILIKE '%Tikrar%Tahfidz%'
   OR name ILIKE '%Tikrar%MTI%Batch%2%'
RETURNING id, name, status;
```

---

### STEP 2: Cek Browser Console (User yang TIDAK bisa lihat card)

1. Login sebagai **user yang TIDAK bisa lihat card**
2. Buka Dashboard
3. Tekan **F12** → tab **Console**
4. Cari log dengan format:

```
=== Loading Batch Info ===
User: user@email.com Role: calon_thalibah
```

**Skenario yang mungkin:**

#### ✅ Skenario A: Cache hit
```
Using cached batch info: Tikrar MTI Batch 2
```
→ **Berarti data ada di cache, tapi tidak dirender**
→ **Solusi:** Lanjut ke STEP 3

#### ⚠️ Skenario B: No cache, fetching from API
```
No cache found, fetching from API
Querying batches with status=open...
Query result: { data: [], error: null }
⚠️ No batch found with status=open
```
→ **Berarti tidak ada batch dengan status='open' di database**
→ **Solusi:** Kembali ke STEP 1, update status batch

#### ❌ Skenario C: Permission denied error
```
❌ Error querying batches: { message: "permission denied", code: "42501" }
```
→ **Berarti RLS policy masih blocking (unexpected)**
→ **Solusi:** Lanjut ke STEP 4

---

### STEP 3: Clear Cache & Hard Refresh

**Untuk user yang tidak bisa lihat card:**

1. Buka **Developer Tools** (F12)
2. Buka tab **Console**
3. Ketik dan jalankan:
   ```javascript
   localStorage.clear()
   ```
4. Tutup Developer Tools
5. Hard refresh halaman: **Ctrl + Shift + R** (atau Cmd + Shift + R di Mac)
6. Cek apakah card muncul

**Jika masih tidak muncul:** Lanjut ke STEP 4

---

### STEP 4: Verify RLS Policy (Manual Check)

Jalankan di **Supabase SQL Editor**:

```sql
-- Check SELECT policies
SELECT
    policyname,
    cmd,
    roles,
    qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'batches'
  AND cmd = 'SELECT'
ORDER BY policyname;
```

**Expected:** Harus ada policy dengan:
- `policyname`: `batches_select_all`
- `cmd`: `SELECT`
- `roles`: `{authenticated}`
- `using_expression`: `true`

**Jika TIDAK ADA policy seperti itu:**

Jalankan script fix: `scripts/fix_batches_rls_for_all_users.sql`

---

### STEP 5: Test Query Langsung di Supabase

Login ke **Supabase Dashboard** sebagai **user yang tidak bisa lihat card**:

1. Buka **SQL Editor**
2. Pilih "RLS" mode (bukan service_role mode)
3. Jalankan:
   ```sql
   SELECT * FROM batches WHERE status = 'open' LIMIT 1;
   ```

**Expected:** Harus mengembalikan 1 row

**Jika ERROR "permission denied":**
- RLS policy masih bermasalah
- Check ulang STEP 4

---

## 🐛 Common Issues & Solutions

### Issue 1: Cache stale/corrupt
**Symptom:** Console log menunjukkan "Using cached batch info" tapi card tidak muncul

**Solution:**
```javascript
// Di browser console
localStorage.removeItem('dashboard_batch_info')
location.reload()
```

---

### Issue 2: Batch status bukan 'open'
**Symptom:** Console log menunjukkan "No batch found with status=open"

**Solution:**
```sql
-- Update batch status
UPDATE batches
SET status = 'open'
WHERE name ILIKE '%Tikrar%'
RETURNING id, name, status;
```

---

### Issue 3: User tidak ter-authenticate
**Symptom:** Console log tidak muncul sama sekali, atau user redirect ke login

**Solution:**
- Logout dan login ulang
- Clear all cookies
- Check session expiration

---

### Issue 4: Multiple conflicting policies
**Symptom:** Ada banyak policies di pg_policies dengan kondisi berbeda

**Solution:**
```sql
-- Drop semua policies lama
DROP POLICY IF EXISTS "Admins can view all batches" ON public.batches;
DROP POLICY IF EXISTS "Users can view own batches" ON public.batches;

-- Keep only batches_select_all
-- (Policy ini sudah ada dan benar, tidak perlu recreate)
```

---

## 📊 Debug Checklist

Untuk setiap user yang **TIDAK bisa lihat card**, cek:

- [ ] User sudah login dengan benar (authenticated)
- [ ] Console log menunjukkan "Loading Batch Info"
- [ ] Ada batch dengan status='open' di database
- [ ] Policy `batches_select_all` ada dan active
- [ ] Query `SELECT * FROM batches WHERE status='open'` berhasil (test di SQL Editor RLS mode)
- [ ] Cache di localStorage sudah di-clear
- [ ] Hard refresh (Ctrl+Shift+R) sudah dilakukan

---

## 📝 Files Terkait

- **Component:** `components/DashboardContent.tsx` (line 87-157)
- **Debug Script:** `scripts/debug_dashboard_card.sql`
- **Fix Script:** `scripts/fix_batches_rls_for_all_users.sql`
- **Documentation:** `docs/FIX_DASHBOARD_CARD_NOT_SHOWING.md`

---

## 💡 Quick Fix (Jika semua langkah di atas gagal)

Temporary workaround - disable cache:

```typescript
// Di components/DashboardContent.tsx, comment out cache logic:
// const cached = localStorage.getItem('dashboard_batch_info')
// if (cached) { ... }

// Langsung fetch dari API setiap kali
```

Tapi ini bukan solusi permanent, tetap harus fix root cause-nya.

---

**Status:** Ready for debugging
**Last Updated:** 2025-12-16
