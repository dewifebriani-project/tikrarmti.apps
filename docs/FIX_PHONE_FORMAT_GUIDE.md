# 📱 Fix Phone Number Format - Complete Guide

## 🎯 Tujuan

Memperbaiki format nomor telepon WhatsApp dan Telegram yang salah:
- **Format Salah**: `+62085255826133` (ada angka 0 setelah +62)
- **Format Benar**: `+6285255826133` (tidak ada angka 0 setelah +62)

## ⚠️ PENTING: Data Safety

Script ini dirancang dengan sangat hati-hati untuk:
- ✅ **HANYA** menghapus angka 0 yang ada di antara `+62` dan angka berikutnya
- ✅ **TIDAK** menghapus nomor telepon
- ✅ **TIDAK** mengubah nomor yang sudah benar
- ✅ Menampilkan preview sebelum update (jika menggunakan SQL script)
- ✅ Memberikan summary lengkap setelah update

## 📋 Files yang Dibuat

### 1. SQL Script (Untuk Supabase SQL Editor)
**File:** `scripts/fix_phone_format.sql`

**Keuntungan:**
- ✅ Langsung dijalankan di Supabase
- ✅ Bisa lihat preview perubahan sebelum commit
- ✅ Transaction-based (bisa rollback jika ada masalah)

### 2. JavaScript Script (Untuk Node.js)
**File:** `scripts/fix_phone_format.js`

**Keuntungan:**
- ✅ Lebih verbose output (detail setiap perubahan)
- ✅ Error handling per user
- ✅ Bisa dijalankan dari command line

---

## 🚀 Cara Menggunakan

### Opsi 1: Menggunakan SQL Script (RECOMMENDED)

#### Step 1: Login ke Supabase
1. Buka https://supabase.com/dashboard
2. Pilih project Anda
3. Klik **SQL Editor** di sidebar kiri

#### Step 2: Copy Script
1. Buka file `scripts/fix_phone_format.sql`
2. Copy semua isi file (Ctrl+A, Ctrl+C)

#### Step 3: Paste dan Run
1. Di Supabase SQL Editor, klik **New Query**
2. Paste script yang sudah dicopy
3. Klik **Run** atau tekan `Ctrl+Enter`

#### Step 4: Review Output
Script akan menampilkan:

**Preview sebelum update:**
```sql
id | full_name | old_whatsapp      | old_telegram      | new_whatsapp     | new_telegram
---|-----------|-------------------|-------------------|------------------|------------------
1  | Dewi      | +62085255826133   | +62085255826133   | +6285255826133   | +6285255826133
```

**Summary:**
```sql
total_records_to_update | whatsapp_to_fix | telegram_to_fix
------------------------|-----------------|----------------
5                       | 3               | 4
```

**Verification after update:**
```sql
field    | total_records | correct_format | wrong_format_085 | other_wrong_format
---------|---------------|----------------|------------------|-------------------
WhatsApp | 10            | 10             | 0                | 0
Telegram | 8             | 8              | 0                | 0
Phone    | 12            | 12             | 0                | 0
```

#### Step 5: Verify Success
- Jika `wrong_format_085` = 0, berarti semua sudah benar! ✅
- Jika ada yang masih salah, cek bagian "Optional: Check for other potential issues"

---

### Opsi 2: Menggunakan JavaScript Script

#### Step 1: Pastikan Environment Variables
Pastikan file `.env.local` berisi:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### Step 2: Run Script
```bash
node scripts/fix_phone_format.js
```

#### Step 3: Review Output
Script akan menampilkan output detail seperti:

```
=== FIX PHONE NUMBER FORMAT ===

Step 1: Checking for phone numbers that need fixing...

Found 3 user(s) with phone numbers to fix:

1. Dewi Admin (ID: abc-123)
   WhatsApp: +62085255826133 → +6285255826133
   Telegram: +62085255826133 → +6285255826133

2. Siti (ID: def-456)
   WhatsApp: +62081234567890 → +6281234567890

3. Rina (ID: ghi-789)
   Telegram: +62087654321098 → +6287654321098


Step 2: Updating phone numbers...

✅ Updated Dewi Admin
✅ Updated Siti
✅ Updated Rina

=== UPDATE SUMMARY ===
✅ Successfully updated: 3
❌ Failed to update: 0
📊 Total processed: 3

Step 3: Verifying changes...

Recent phone numbers (showing 20 most recent):
1. Dewi Admin
   WhatsApp: +6285255826133
   Telegram: +6285255826133

2. Siti
   WhatsApp: +6281234567890

3. Rina
   Telegram: +6287654321098


Step 4: Checking for any remaining issues...

✅ All phone numbers are now in correct format!

=== FINAL STATISTICS ===

WhatsApp:
  Total numbers: 10
  Correct format (+6285...): 10
  Wrong format (+62085...): 0

Telegram:
  Total numbers: 8
  Correct format (+6285...): 8
  Wrong format (+62085...): 0

Phone:
  Total numbers: 12
  Correct format (+6285...): 12
  Wrong format (+62085...): 0

=== DONE ===
```

---

## 🔍 Bagaimana Script Bekerja?

### Logic yang Digunakan:

#### SQL Version:
```sql
-- Cari nomor yang dimulai dengan +620
WHERE whatsapp LIKE '+620%'

-- Replace +620 dengan +62
UPDATE users SET whatsapp = REPLACE(whatsapp, '+620', '+62')
```

#### JavaScript Version:
```javascript
// Cek apakah nomor dimulai dengan +620
if (user.whatsapp && user.whatsapp.startsWith('+620')) {
  // Replace +620 dengan +62
  updates.whatsapp = user.whatsapp.replace('+620', '+62');
}
```

### Contoh Transformasi:

| Before              | After             | Keterangan                           |
|---------------------|-------------------|--------------------------------------|
| `+62085255826133`   | `+6285255826133`  | ✅ Benar - menghapus 0 setelah +62  |
| `+62081234567890`   | `+6281234567890`  | ✅ Benar - menghapus 0 setelah +62  |
| `+6285255826133`    | `+6285255826133`  | ✅ Tidak berubah - sudah benar      |
| `085255826133`      | `085255826133`    | ⚠️ Tidak berubah - format berbeda   |
| `628255826133`      | `628255826133`    | ⚠️ Tidak berubah - format berbeda   |

### Aman dari:

❌ **TIDAK** akan menghapus nomor seperti ini:
- `+6280123456789` (angka setelah +62 adalah 8, bukan 08)
- `+6285255826133` (sudah benar, tidak ada 0 setelah +62)
- `085255826133` (tidak dimulai dengan +62)

✅ **HANYA** akan memperbaiki nomor seperti ini:
- `+62085255826133` → `+6285255826133`
- `+62081234567890` → `+6281234567890`
- `+62087654321098` → `+6287654321098`

---

## 📊 Testing

### Test Case 1: Preview (SQL)
```sql
-- Jalankan query SELECT ini dulu untuk melihat preview
SELECT
  id,
  full_name,
  whatsapp as old_whatsapp,
  CASE
    WHEN whatsapp LIKE '+620%' THEN REPLACE(whatsapp, '+620', '+62')
    ELSE whatsapp
  END as new_whatsapp
FROM users
WHERE whatsapp LIKE '+620%';
```

### Test Case 2: Single User Test (JavaScript)
Modify script untuk test 1 user saja:
```javascript
// Tambahkan .limit(1) di query pertama
const { data: usersToFix, error: fetchError } = await supabase
  .from('users')
  .select('id, full_name, whatsapp, telegram, phone')
  .or('whatsapp.like.+620%,telegram.like.+620%,phone.like.+620%')
  .limit(1); // Test 1 user dulu
```

---

## ✅ Verification Checklist

Setelah menjalankan script, verify dengan checklist ini:

### Database Check:
- [ ] Login ke Supabase → Table Editor → `users`
- [ ] Filter kolom `whatsapp` dengan: `+620%`
- [ ] Seharusnya **TIDAK ADA** hasil (artinya semua sudah benar)
- [ ] Filter kolom `telegram` dengan: `+620%`
- [ ] Seharusnya **TIDAK ADA** hasil

### Sample Data Check:
- [ ] Pilih beberapa user secara random
- [ ] Check format WhatsApp: harus `+6285...` bukan `+62085...`
- [ ] Check format Telegram: harus `+6285...` bukan `+62085...`
- [ ] Pastikan TIDAK ADA nomor yang hilang/terhapus

### Application Check:
- [ ] Buka aplikasi di http://localhost:3005/admin
- [ ] Go to Users tab
- [ ] Check beberapa user data
- [ ] Pastikan nomor telepon masih ada dan formatnya benar

---

## 🔄 Rollback (Jika Ada Masalah)

### Jika menggunakan SQL Script:
Jika ada masalah dan Anda belum `COMMIT`, jalankan:
```sql
ROLLBACK;
```

### Jika sudah COMMIT atau menggunakan JavaScript:
Anda perlu backup data terlebih dahulu sebelum menjalankan script.

**Cara backup:**
```bash
# Backup menggunakan PowerShell script
.\scripts\backup-database.ps1
```

**Cara restore dari backup:**
```bash
.\scripts\restore-database.ps1 <backup_filename>
```

---

## 📈 Expected Results

### Before:
```
Users table:
- 10 users total
- 3 users dengan WhatsApp format +62085...
- 2 users dengan Telegram format +62085...
```

### After:
```
Users table:
- 10 users total
- 0 users dengan WhatsApp format +62085... ✅
- 0 users dengan Telegram format +62085... ✅
- Semua nomor sekarang format +6285... ✅
```

---

## 🐛 Troubleshooting

### Issue 1: Script tidak menemukan nomor yang salah
**Solution:**
```sql
-- Manual check di Supabase SQL Editor
SELECT id, full_name, whatsapp, telegram, phone
FROM users
WHERE whatsapp LIKE '+620%' OR telegram LIKE '+620%' OR phone LIKE '+620%';
```
Jika hasilnya kosong, berarti memang tidak ada nomor yang perlu diperbaiki.

### Issue 2: JavaScript script error "Cannot find module"
**Solution:**
```bash
# Install dependencies
npm install

# Pastikan .env.local ada dan berisi keys yang benar
cat .env.local
```

### Issue 3: Supabase error "permission denied"
**Solution:**
- Pastikan Anda menggunakan `SUPABASE_SERVICE_ROLE_KEY` (bukan ANON_KEY)
- Check RLS policies di Supabase → Table Editor → users → Policies

### Issue 4: Nomor masih salah setelah update
**Solution:**
```sql
-- Check apakah ada pattern lain
SELECT DISTINCT
  SUBSTRING(whatsapp, 1, 5) as whatsapp_prefix,
  COUNT(*) as count
FROM users
WHERE whatsapp IS NOT NULL AND whatsapp != ''
GROUP BY SUBSTRING(whatsapp, 1, 5)
ORDER BY count DESC;
```

---

## 📝 Summary

### Files Created:
1. ✅ `scripts/fix_phone_format.sql` - SQL script untuk Supabase
2. ✅ `scripts/fix_phone_format.js` - JavaScript script untuk Node.js
3. ✅ `docs/FIX_PHONE_FORMAT_GUIDE.md` - Dokumentasi lengkap (file ini)

### What It Does:
- ✅ Memperbaiki format nomor WhatsApp dari `+62085...` → `+6285...`
- ✅ Memperbaiki format nomor Telegram dari `+62085...` → `+6285...`
- ✅ Memperbaiki format nomor Phone dari `+62085...` → `+6285...`
- ✅ Update field `updated_at` otomatis
- ✅ Tidak mengubah nomor yang sudah benar
- ✅ Tidak menghapus data apapun

### Safety Features:
- ✅ Preview perubahan sebelum update (SQL version)
- ✅ Transaction-based dengan COMMIT/ROLLBACK (SQL version)
- ✅ Detailed logging setiap perubahan (JavaScript version)
- ✅ Verification summary setelah update
- ✅ Statistics report

---

## 🚦 Next Steps

1. **BACKUP DATABASE DULU!**
   ```bash
   .\scripts\backup-database.ps1
   ```

2. **Pilih metode yang Anda sukai:**
   - SQL Script (recommended): Run di Supabase SQL Editor
   - JavaScript Script: Run dengan `node scripts/fix_phone_format.js`

3. **Verify hasilnya:**
   - Check di Supabase Table Editor
   - Check di aplikasi admin page

4. **Jika sudah yakin semua benar:**
   - Lanjut dengan script lain yang pending:
     - `fix_cascade_delete_constraints.sql`
     - `update_batch_name_in_tikrar.sql`

---

**Last Updated:** 2025-12-14
**Status:** ✅ Ready to use
**Priority:** 🟡 MEDIUM (run setelah backup database)
