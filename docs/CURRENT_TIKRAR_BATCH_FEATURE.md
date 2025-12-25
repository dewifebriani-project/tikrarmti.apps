# Current Tikrar Batch Feature

## Overview
Fitur untuk tracking batch tikrar aktif yang sedang diikuti user. Data batch yang ditampilkan adalah **dinamis** berdasarkan batch terbaru yang sedang open/ongoing, bukan hardcoded.

## Database Schema

### Kolom Baru di Tabel `users`
```sql
current_tikrar_batch_id uuid REFERENCES batches(id)
```

Field ini menyimpan referensi ke batch tikrar yang sedang aktif untuk user tersebut.

## Cara Kerja

### 1. Auto-Update via Trigger
Ketika status pendaftaran berubah menjadi `approved` atau `selected`:
```sql
-- Trigger akan otomatis update current_tikrar_batch_id
UPDATE users
SET current_tikrar_batch_id = pendaftaran.batch_id
WHERE id = pendaftaran.user_id
```

### 2. Display di Admin Panel
Kolom "Tikrar Batch" menampilkan:
- **Badge dengan nama batch** (e.g., "Tikrar MTI Batch 2")
- **Warna dinamis** berdasarkan status batch:
  - 🟢 **Hijau** = Batch sedang open (pendaftaran dibuka)
  - 🔵 **Biru** = Batch sedang ongoing (program berjalan)
  - ⚫ **Abu-abu** = Batch sudah closed
  - 🟣 **Ungu** = Batch draft atau status lain
- **Checkmark (✓)** = Menunjukkan ini adalah batch aktif saat ini
- **Status seleksi** = Diterima, Menunggu, Tidak Diterima, dll.

### 3. Data Dinamis
- **Batch 1 open** → User yang approved akan muncul "Tikrar MTI Batch 1"
- **Batch 2 open** → User yang approved akan muncul "Tikrar MTI Batch 2"
- **Batch 3 open** → User yang approved akan muncul "Tikrar MTI Batch 3"

Data **TIDAK hardcoded**, otomatis berubah sesuai batch yang sedang dibuka.

## API Changes

### GET /api/admin/users
Sekarang mengembalikan field tambahan:
```typescript
{
  current_tikrar_batch_id: string;
  current_tikrar_batch: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: 'open' | 'ongoing' | 'closed' | 'draft';
  };
}
```

## Migration Scripts

### 1. Add Column
File: `supabase/migrations/20251225_add_current_tikrar_batch_to_users.sql`

Menambahkan:
- Kolom `current_tikrar_batch_id`
- Foreign key constraint
- Index untuk performa
- Trigger untuk auto-update
- View `v_users_with_tikrar_batch`

### 2. Run Migration
**Via Supabase Dashboard:**
1. Buka https://supabase.com/dashboard
2. Pilih project
3. Buka SQL Editor
4. Copy & paste isi file migration
5. Klik "Run"

## Penggunaan

### Admin Panel
Kolom "Tikrar Batch" otomatis muncul di tabel users dengan informasi:
- Nama batch saat ini
- Status batch (warna badge)
- Status seleksi user
- Indicator batch aktif (✓)

### Query Manual
```sql
-- Lihat semua user dengan batch aktif mereka
SELECT * FROM v_users_with_tikrar_batch;

-- Update manual jika diperlukan
UPDATE users
SET current_tikrar_batch_id = 'batch-uuid-here'
WHERE id = 'user-uuid-here';
```

## Benefits

1. **Dinamis** - Tidak perlu update kode saat buka batch baru
2. **Auto-update** - Trigger otomatis set batch saat user di-approve
3. **Clear indication** - Admin bisa langsung lihat user di batch mana
4. **Performance** - Index memastikan query cepat
5. **Scalable** - Siap untuk batch 3, 4, 5, dst tanpa perubahan kode

## Examples

### User Journey
1. User daftar Batch 2 → status: `pending`
2. Admin approve → trigger set `current_tikrar_batch_id = batch_2_id`
3. Admin panel menampilkan:
   ```
   📘 Tikrar MTI Batch 2 ✓
   ✅ Disetujui
   ```

### Batch Transition
- Batch 2 status: `closed`
- Batch 3 status: `open`
- User baru daftar Batch 3 dan di-approve
- Admin panel menampilkan:
  ```
  📗 Tikrar MTI Batch 3 ✓  (hijau = open)
  ✅ Disetujui
  ```

## Notes

- Kolom ini **opsional** - user tanpa registrasi akan menampilkan "-"
- Fallback ke `tikrar_registrations` jika `current_tikrar_batch` kosong
- View `v_users_with_tikrar_batch` bisa digunakan untuk reporting
- Trigger hanya update saat status berubah ke `approved`/`selected`
