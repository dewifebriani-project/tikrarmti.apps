# Debug Jurnal Records - 0/4 Issue

Script untuk mendiagnosis kenapa jurnal records menunjukkan 0/4 di interface musyrifah.

## ✅ PERBAIKAN SUDAH DILAKUKAN

**Masalah yang ditemukan:** `generateAllBlocks()` di jurnal API menggunakan logic yang berbeda dengan tashih API.

- **Jurnal (sebelumnya):** `blockNumber = (week - 1) * 4 + 1` untuk part A
  - Week 1 → H1A-H1D ✅
  - Week 2 → H5A-H5D ❌ (seharusnya H2A-H2D)
  - Week 3 → H9A-H9D ❌ (seharusnya H3A-H3D)

- **Tashih (benar):** `blockNumber = week + blockOffset`
  - Week 1 → H1A-H1D ✅
  - Week 2 → H2A-H2D ✅
  - Week 3 → H3A-H3D ✅

**Perbaikan:** [`route.ts:46-64`](../app/api/musyrifah/jurnal/route.ts#L46-L64) sekarang menggunakan logic yang sama dengan tashih.

## 🔧 Cara Menjalankan

### 1. Test Block Mapping (Verifikasi Perbaikan)

Jalankan test script untuk memverifikasi consistency:
```bash
npx tsx scripts/test-block-mapping.ts
```

Expected output:
```
✅ All blocks are consistent! generateAllBlocks() and calculateWeekFromBlok() match perfectly.
```

### 2. Quick Check Jurnal Records

Jalankan quick check script:
```bash
npm run debug:jurnal
```

Atau jalankan langsung dengan tsx:
```bash
npx tsx scripts/quick-check-jurnal.ts
```

### Opsi 2: SQL Query di Supabase

1. Buka Supabase Dashboard
2. Ke SQL Editor
3. Copy-paste query dari [`debug-jurnal.sql`](debug-jurnal.sql)
4. Jalankan query satu per satu

### Opsi 3: API Debug Endpoint

Jalankan debug API yang sudah ada:
```bash
curl http://localhost:3003/api/musyrifah/debug-jurnal
```

## 📋 Output dari Script

Script akan mengecek:

### 1. Format Blok Field
```
🔍 Blok Field Format Analysis:
   Empty/Null: X
   Single String: X
   JSON String Array: X
   Array: X
```

### 2. Unique Blok Values
```
📋 Unique Blok Values (X):
   H1A, H1B, H1C, H1D, H2A, ...
```

### 3. Week Distribution
```
📅 Week Distribution (from blok codes):
   ✅ Week 1: X records
   ⚠️ Week 2: X records
   ❌ Week 3: 0 records
   ...
```

### 4. Potential Issues
```
🔬 Potential Issues:
   ⚠️ ISSUE 1: X records dengan blok kosong/null
   ⚠️ ISSUE 2: Blok format tidak valid: ...
```

## 🐛 Common Issues & Solutions

### Issue 1: Blok Field NULL atau Kosong

**Problem:** Record jurnal ada tapi blok field kosong.

**Solution:**
```sql
-- Cek records dengan blok null
SELECT id, user_id, juz_code, created_at
FROM jurnal_records
WHERE blok IS NULL;

-- Update dengan blok yang sesuai
UPDATE jurnal_records
SET blok = 'H1A' -- ganti dengan blok yang sesuai
WHERE id = 'RECORD_ID';
```

### Issue 2: Format Blok Tidak Sesuai

**Problem:** Blok tidak dalam format `H1A`, `H1B`, dll.

**Solution:**
```sql
-- Update format blok yang salah
UPDATE jurnal_records
SET blok = 'H1A' -- format yang benar
WHERE blok = 'blok-yang-salah';
```

### Issue 3: Blok Tidak Match dengan Juz

**Problem:** Blok `H1A` tapi juz-nya `30B` (seharusnya mulai dari `H11A`).

**Solution:**
```sql
-- Update juz_code atau blok agar sesuai
UPDATE jurnal_records
SET juz_code = '30A' -- atau blok yang sesuai
WHERE blok LIKE 'H1%' AND juz_code = '30B';
```

### Issue 4: generateAllBlocks() Menghasilkan Blok Berbeda

**Problem:** Fungsi `generateAllBlocks()` di API menghasilkan blok codes yang berbeda dengan yang ada di database.

**Di [`route.ts:46-89`](../app/api/musyrifah/jurnal/route.ts):**
```typescript
function generateAllBlocks(juzInfo: any) {
  const allBlocks: any[] = [];
  const parts = ['A', 'B', 'C', 'D'];
  const blockOffset = juzInfo.part === 'B' ? 10 : 0;

  for (let week = 1; week <= 10; week++) {
    const blockNumber = week + blockOffset;  // <-- INI BISA JADI MASALAH
    // ...
  }
}
```

**Untuk Juz 30A:** Harus generate blok H1A-H1D, H2A-H2D, ..., H20A-H20D (40 blok untuk 15 pekan, bukan 40 blok untuk 10 pekan)

**Check:**
```sql
-- Cek juz info untuk 30A
SELECT * FROM juz_options WHERE code = '30A';
```

## 🔍 Debugging Steps

1. **Jalankan quick check script**
   ```bash
   npm run debug:jurnal
   ```

2. **Identifikasi issue dari output**
   - Apakah ada blok yang kosong?
   - Apakah format blok sesuai?
   - Apakah blok sesuai dengan juz?

3. **Perbaiki data jika perlu**
   - Gunakan SQL query dari `debug-jurnal.sql`
   - Update data yang salah

4. **Re-check setelah perbaikan**
   ```bash
   npm run debug:jurnal
   ```

5. **Refresh interface musyrifah**
   - Buka panel musyrifah
   - Klik "Refresh" button
   - Cek apakah data sudah muncul

## 📞 Masih Ada Issue?

Jika masih ada issue setelah debugging:
1. Cek API response di browser DevTools (Network tab)
2. Cek `calculateWeeklyStatus()` function di [route.ts:93-139](../app/api/musyrifah/jurnal/route.ts#L93-L139)
3. Cek frontend rendering di [page.tsx:1049-1121](../app/(protected)/panel-musyrifah/page.tsx#L1049-L1121)

## 📝 Catatan

- Blok format: `H{number}{letter}` (e.g., H1A, H1B, H1C, H1D)
- Week calculation: H1-H10 = Week 1-10, H11-H20 = Week 1-10 (untuk juz 30B)
- Untuk Juz 30A (5 halaman), hanya ada 15 blok, bukan 40 blok
