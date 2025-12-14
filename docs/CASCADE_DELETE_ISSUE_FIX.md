# 🚨 CASCADE DELETE ISSUE - URGENT FIX

## MASALAH YANG TERJADI

Saat menghapus **Batch 1** dari Admin Dashboard, data di tabel `pendaftaran_tikrar_tahfidz` **IKUT TERHAPUS** karena constraint `ON DELETE CASCADE`.

### Root Cause

Database memiliki foreign key constraints dengan `ON DELETE CASCADE` yang menyebabkan:

```
batches (id)
  ↓ CASCADE DELETE
programs (batch_id)
  ↓ CASCADE DELETE
pendaftaran_tikrar_tahfidz (program_id, batch_id)
  → DATA HILANG! ❌
```

### Tabel Yang Terdampak

File: `scripts/fix_tikrar_table_safe.sql`, `scripts/fix_tikrar_table_schema.sql`, `scripts/sql-schema-update.sql`

```sql
-- DANGEROUS CONSTRAINTS (akan menghapus data):
FOREIGN KEY (batch_id) REFERENCES batches (id) ON DELETE CASCADE
FOREIGN KEY (program_id) REFERENCES programs (id) ON DELETE CASCADE
FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
```

## ✅ SOLUSI YANG TELAH DITERAPKAN

### 1. IMMEDIATE FIX - Disable Delete Buttons (✅ SUDAH DITERAPKAN)

File yang diupdate: `app/admin/page.tsx`

**Batches Tab** - Line ~648:
```typescript
// Delete button DIHAPUS dari AdminDataTable
<AdminDataTable
  data={batches}
  columns={columns}
  onEdit={handleEdit}
  // onDelete={handleDelete} ❌ REMOVED
  rowKey="id"
/>

// Warning ditambahkan
<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
  <p className="text-sm text-red-800">
    ⚠️ Warning: Batch deletion is temporarily disabled because it will
    CASCADE DELETE all related data (programs, pendaftaran, tikrar_tahfidz).
  </p>
</div>
```

**Programs Tab** - Line ~989:
```typescript
// Delete button DIHAPUS
// Warning ditambahkan
```

**Halaqah Tab** - Line ~1315:
```typescript
// Delete button DIHAPUS
// Warning ditambahkan
```

### 2. DATABASE FIX - Change CASCADE to RESTRICT

File: `scripts/fix_cascade_delete_constraints.sql`

**Cara Menjalankan:**

1. **Login ke Supabase Dashboard**
   - https://supabase.com/dashboard
   - Pilih project Anda

2. **Buka SQL Editor**
   - Sidebar → SQL Editor
   - Klik "New Query"

3. **Copy & Paste Script**
   - Buka file: `scripts/fix_cascade_delete_constraints.sql`
   - Copy semua isi file
   - Paste ke SQL Editor

4. **RUN Script**
   - Klik "Run" atau tekan Ctrl+Enter
   - Tunggu sampai selesai

5. **Verify Changes**
   - Script akan menampilkan tabel foreign keys
   - Pastikan `delete_rule` = **RESTRICT** (bukan CASCADE)

**Expected Output:**
```
table_name                  | column_name | foreign_table_name | delete_rule
----------------------------|-------------|--------------------|--------------
pendaftaran_tikrar_tahfidz  | batch_id    | batches            | RESTRICT ✅
pendaftaran_tikrar_tahfidz  | program_id  | programs           | RESTRICT ✅
pendaftaran_tikrar_tahfidz  | user_id     | users              | RESTRICT ✅
...
```

## PERBEDAAN CASCADE vs RESTRICT

### ON DELETE CASCADE (❌ BAHAYA)
```
DELETE FROM batches WHERE id = 'batch-1';
→ Otomatis menghapus:
  - Semua programs dengan batch_id = 'batch-1'
  - Semua pendaftaran_tikrar_tahfidz terkait
  - Semua data terkait lainnya
→ DATA HILANG PERMANEN!
```

### ON DELETE RESTRICT (✅ AMAN)
```
DELETE FROM batches WHERE id = 'batch-1';
→ Database akan ERROR:
  "ERROR: update or delete on table "batches" violates
   foreign key constraint on table "programs""
→ Data TIDAK akan terhapus
→ Anda harus hapus data terkait MANUAL terlebih dahulu
```

## LANGKAH RECOVERY (Jika Data Sudah Terhapus)

### Option 1: Restore dari Backup

```bash
# Jika ada backup database
psql -U postgres -d database_name < backup_file.sql
```

### Option 2: Restore Manual (jika ada record)

1. Cek di Supabase → Table Editor → `pendaftaran_tikrar_tahfidz`
2. Jika data masih ada, export ke CSV
3. Jika sudah terhapus, cek apakah ada:
   - Backup aplikasi
   - Export data sebelumnya
   - Log audit trail

### Option 3: Recreate Data

Jika tidak ada backup, Anda perlu input ulang data yang hilang.

## BEST PRACTICES KEDEPAN

### 1. ✅ Gunakan SOFT DELETE

Tambah column `deleted_at`:

```sql
ALTER TABLE batches ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE programs ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE pendaftaran_tikrar_tahfidz ADD COLUMN deleted_at TIMESTAMP NULL;

-- Soft delete (set timestamp, tidak delete dari database)
UPDATE batches SET deleted_at = NOW() WHERE id = 'batch-1';

-- Query hanya data yang belum dihapus
SELECT * FROM batches WHERE deleted_at IS NULL;
```

### 2. ✅ Gunakan ON DELETE RESTRICT

```sql
-- Untuk referential integrity tanpa auto-delete
FOREIGN KEY (batch_id) REFERENCES batches (id) ON DELETE RESTRICT
```

### 3. ✅ Gunakan ON DELETE SET NULL (untuk optional relations)

```sql
-- Jika relasi optional, set NULL instead of delete
FOREIGN KEY (optional_batch_id) REFERENCES batches (id) ON DELETE SET NULL
```

### 4. ✅ Implementasi Audit Trail

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT,
  record_id UUID,
  action TEXT, -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. ✅ Backup Rutin

```bash
# Setup automated daily backup
# File: scripts/backup-database.sh
pg_dump -U postgres -d database_name > backup_$(date +%Y%m%d).sql
```

## TESTING SETELAH FIX

### Test 1: Verify Constraints Changed

```sql
-- Run in Supabase SQL Editor
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND rc.delete_rule = 'CASCADE'
ORDER BY tc.table_name;

-- HASIL HARUS KOSONG (no CASCADE constraints)
```

### Test 2: Try Delete (Should FAIL)

```sql
-- Try to delete a batch that has programs
DELETE FROM batches WHERE id = 'some-batch-id';

-- Expected result:
-- ERROR: update or delete on table "batches" violates foreign key constraint
-- This is GOOD! ✅
```

### Test 3: Delete UI Hidden

1. Buka http://localhost:3005/admin
2. Go to Batches tab
3. Verify: **NO delete button** in action column
4. Verify: **Warning message** ditampilkan di bawah table

## CHECKLIST

- [x] Delete buttons dihapus dari Batches, Programs, Halaqah tables
- [x] Warning messages ditambahkan di setiap tab
- [x] SQL script untuk fix constraints dibuat
- [ ] **PENTING: Jalankan SQL script di Supabase** ⚠️
- [ ] Verify constraints berubah ke RESTRICT
- [ ] Test delete operation (harus ERROR)
- [ ] Dokumentasi diberikan ke user
- [ ] Setup backup rutin (recommended)
- [ ] Implementasi soft delete (optional, untuk masa depan)

## FILES MODIFIED

1. `app/admin/page.tsx` - Removed delete buttons, added warnings
2. `scripts/fix_cascade_delete_constraints.sql` - Database fix script (NEW)
3. `docs/CASCADE_DELETE_ISSUE_FIX.md` - This documentation (NEW)

## NEXT STEPS

1. **SEGERA**: Jalankan SQL script di Supabase untuk fix constraints
2. **SEGERA**: Verify bahwa delete_rule berubah ke RESTRICT
3. **Recovery**: Restore data yang terhapus (jika ada backup)
4. **Long-term**: Implementasi soft delete untuk semua tables
5. **Long-term**: Setup automated backup

## CONTACT

Jika butuh bantuan recovery data atau pertanyaan:
- Check backup files di folder `backups/`
- Check Supabase Point-in-Time Recovery (jika enabled)
- Contact database admin untuk restore dari backup

---

**Last Updated:** 2025-12-14
**Status:** ⚠️ CRITICAL - Requires immediate action
**Priority:** 🔴 HIGHEST
