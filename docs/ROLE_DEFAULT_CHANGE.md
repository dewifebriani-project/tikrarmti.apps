# Perubahan Default Role untuk User Baru

## Ringkasan
Semua user yang baru mendaftar kini otomatis mendapat role `calon_thalibah` (bukan `user` atau `thalibah`).

## Perubahan yang Dilakukan

### 1. Frontend - Formulir Registrasi
**File**: `app/register/page.tsx` (Baris 144)
- Mengubah role dari `'user'` menjadi `'calon_thalibah'` saat mengirim data registrasi

### 2. Backend - API Register
**File**: `app/api/auth/register/route.ts` (Baris 16)
- Mengubah default role dari `'user'` menjadi `'calon_thalibah'`
- Berlaku untuk semua registrasi baru (manual form dan Google OAuth)

### 3. Library - Auth Functions
**File**: `lib/auth.ts` (Baris 124)
- Function `registerWithEmail` sudah menggunakan default `role: UserRole = 'calon_thalibah'`
- Function `createUserProfile` juga sudah sesuai

### 4. Library - Notifications
**File**: `lib/notifications.ts` (Baris 175, 223)
- Mengubah default role di notifikasi dari `'user'` menjadi `'calon_thalibah'`

### 5. Database - Trigger Function
**File**:
- `scripts/database_complete_fix.sql` (Baris 62)
- `scripts/apply_db_fix.js` (Baris 55)

Trigger database `handle_new_user()` diubah:
```sql
COALESCE(new.raw_user_meta_data->>'role', 'calon_thalibah')
```

## Alur Registrasi Baru

1. **User Registrasi** → Role: `calon_thalibah`
2. **User Mengisi Form Pendaftaran Program** → Buat entry di `pendaftaran_batch2`
3. **Admin Approve Pendaftaran** → Role upgrade ke `thalibah`

## Cara Apply Perubahan Database

Jalankan salah satu script berikut untuk update database trigger:

```bash
# Opsi 1: Menggunakan Node.js script
node scripts/apply_db_fix.js

# Opsi 2: Jalankan SQL langsung
# Buka Supabase Dashboard → SQL Editor
# Copy paste isi dari scripts/database_complete_fix.sql
```

## Verifikasi

Untuk memverifikasi perubahan sudah diterapkan:

1. **Test Registrasi Baru**
   - Daftar user baru melalui form registrasi
   - Cek di database: `SELECT * FROM users ORDER BY created_at DESC LIMIT 1;`
   - Role harus `calon_thalibah`

2. **Test Google OAuth**
   - Login dengan Google untuk pertama kali
   - User baru harus mendapat role `calon_thalibah`

3. **Cek Database Trigger**
   ```sql
   -- Di Supabase SQL Editor
   SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
   ```
   - Harus mengandung `'calon_thalibah'` bukan `'thalibah'`

## Role Hierarchy

- `calon_thalibah` - User baru yang belum mendaftar program
- `thalibah` - User yang sudah disetujui dan terdaftar di program
- `musyrifah` - Supervisor/mentor
- `muallimah` - Guru/instruktur
- `admin` - Administrator sistem

## Catatan Penting

⚠️ **PENTING**: Pastikan database trigger sudah di-update dengan menjalankan script SQL fix. Jika tidak, user baru via Google OAuth mungkin masih mendapat role lama.

## Tanggal Perubahan
2025-12-04
