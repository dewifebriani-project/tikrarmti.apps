# Migration: Multi-Role Support

## Overview
Sistem sekarang mendukung multiple roles per user. Satu user bisa memiliki beberapa role sekaligus:
- `calon_thalibah` - User yang mendaftar program tikrar tahfidz
- `thalibah` - Calon thalibah yang lulus seleksi
- `muallimah` - User yang mendaftar sebagai pengajar
- `musyrifah` - User yang mendaftar sebagai pembina
- `admin` - Administrator sistem
- `pengurus` - Pengurus organisasi

## Changes Made

### 1. Database Schema
- Menambah kolom `roles` (text array) di tabel `users`
- Mempertahankan kolom `role` untuk backward compatibility
- Menambah index GIN untuk performa query roles
- Menambah constraint untuk validasi roles

### 2. API Changes
- `GET /api/pendaftaran/my` sekarang mengambil registrasi dari semua tabel:
  - `pendaftaran_tikrar_tahfidz` (calon_thalibah)
  - `muallimah_registrations` (muallimah)
  - `musyrifah_registrations` (musyrifah)
- Setiap registrasi di-tag dengan `registration_type` dan `role`

### 3. Frontend Changes
- Halaman `/pendaftaran` sekarang mengecek status registrasi per role
- User bisa mendaftar di beberapa program dengan role berbeda
- Button "Sudah Terdaftar" hanya muncul untuk role yang sudah terdaftar

## How to Run Migrations

### Option 1: Via Supabase Dashboard (Recommended)
1. Buka Supabase Dashboard: https://supabase.com/dashboard
2. Pilih project: `nmbvklixthlqtkkgqnjl`
3. Buka SQL Editor
4. Copy dan paste isi file berikut satu per satu:
   - `supabase/migrations/20251225_convert_users_role_to_array.sql`
   - `supabase/migrations/20251225_add_role_management_functions.sql`
5. Klik "Run" untuk menjalankan setiap migration

### Option 2: Via Supabase CLI
```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Link to project
npx supabase link --project-ref nmbvklixthlqtkkgqnjl

# Run migrations
npx supabase db push
```

## Helper Functions

### Add Role to User
```sql
SELECT add_user_role(
  'user-uuid-here',
  'muallimah'
);
```

### Remove Role from User
```sql
SELECT remove_user_role(
  'user-uuid-here',
  'calon_thalibah'
);
```

### Check if User Has Role
```sql
SELECT user_has_role(
  'user-uuid-here',
  'thalibah'
);
```

### Upgrade Calon Thalibah to Thalibah
```sql
-- This is automatically called when selection status changes
SELECT upgrade_calon_thalibah_to_thalibah('user-uuid-here');
```

## Usage Examples

### Example 1: User daftar sebagai Calon Thalibah
1. User register → roles: `['calon_thalibah']`
2. User mendaftar tikrar tahfidz → data masuk ke `pendaftaran_tikrar_tahfidz`
3. Status di halaman pendaftaran:
   - ✅ Tikrar Tahfidz: "Sudah Terdaftar"
   - ⭕ Muallimah: "Daftar Sekarang"
   - ⭕ Musyrifah: "Daftar Sekarang"

### Example 2: Calon Thalibah lulus seleksi
1. Admin ubah `selection_status` → 'selected'
2. Trigger automatically call `upgrade_calon_thalibah_to_thalibah()`
3. User roles: `['calon_thalibah', 'thalibah']`

### Example 3: User mendaftar sebagai Muallimah juga
1. User dengan roles `['calon_thalibah', 'thalibah']`
2. User klik "Daftar Sekarang" di card Muallimah
3. Data masuk ke `muallimah_registrations`
4. User roles: `['calon_thalibah', 'thalibah', 'muallimah']`
5. Status di halaman pendaftaran:
   - ✅ Tikrar Tahfidz: "Sudah Terdaftar"
   - ✅ Muallimah: "Sudah Terdaftar"
   - ⭕ Musyrifah: "Daftar Sekarang"

## Testing

### Test Multi-Role Registration
1. Login sebagai user yang sudah terdaftar sebagai calon_thalibah
2. Buka halaman `/pendaftaran`
3. Verify:
   - Card Tikrar Tahfidz menampilkan "Sudah Terdaftar"
   - Card Muallimah menampilkan "Daftar Sekarang"
   - Card Musyrifah menampilkan "Daftar Sekarang"
4. Klik "Daftar Sekarang" di card Muallimah
5. Isi formulir dan submit
6. Kembali ke `/pendaftaran`
7. Verify:
   - Card Tikrar Tahfidz menampilkan "Sudah Terdaftar"
   - Card Muallimah menampilkan "Sudah Terdaftar"
   - Card Musyrifah menampilkan "Daftar Sekarang"

## Backward Compatibility

Kolom `role` (singular) masih dipertahankan untuk backward compatibility:
- Saat role baru ditambah, kolom `role` diupdate ke role terbaru
- Aplikasi lama yang masih menggunakan `role` akan tetap berfungsi
- **Recommendation**: Migrate semua kode untuk menggunakan `roles` array

## Migration Checklist

- [x] Create migration scripts
- [x] Update API `/api/pendaftaran/my`
- [x] Update hook `useMyRegistrations`
- [x] Update halaman `/pendaftaran` untuk check per role
- [ ] Run migrations di Supabase Dashboard
- [ ] Test multi-role registration flow
- [ ] Update dokumentasi API
- [ ] Update halaman perjalanan-saya untuk handle multiple roles

## Notes

- User bisa memiliki beberapa role sekaligus
- Setiap role memiliki tabel registrasi sendiri
- Status "Sudah Terdaftar" dicek per role, bukan global
- Calon thalibah yang lulus seleksi otomatis dapat role thalibah
