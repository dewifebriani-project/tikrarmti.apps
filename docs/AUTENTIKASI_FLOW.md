# Alur Autentikasi Tikrar MTI Apps

## Ringkasan

Sistem autentikasi Tikrar MTI Apps menggunakan Google OAuth dengan validasi database. User harus terdaftar di tabel `public.users` untuk bisa login.

## Alur Autentikasi

### 1. Login dengan Google OAuth
- User klik "Masuk dengan Google"
- Diarahkan ke Google Authentication
- Setelah berhasil, Google redirect ke `/auth/callback`

### 2. Callback Processing
- System mendapatkan session dari Google
- Mengecek apakah user ada di tabel `public.users`:
  - **Jika ada dan lengkap**: Redirect ke `/dashboard`
  - **Jika ada tapi tidak lengkap**: Redirect ke login dengan pesan error
  - **Jika tidak ada**: Sign out dan redirect ke login dengan pesan "belum terdaftar"

### 3. Validasi User di Database
Untuk bisa login, user harus memenuhi syarat:
- **Admin**: Hanya perlu `full_name`
- **Role lain**: Butuh `full_name` dan `phone`

## Database Schema

### Tabel `public.users`
```sql
- id (UUID) - Primary key, sama dengan auth.users.id
- email (TEXT) - Email user
- full_name (TEXT) - Nama lengkap
- phone (TEXT) - Nomor telepon (wajib untuk non-admin)
- role (TEXT) - Role user (admin, thalibah, calon_thalibah, dll)
- is_active (BOOLEAN) - Status aktif
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Masalah Umum

### 1. "User belum terdaftar" padahal sudah login Google
**Penyebab**: User ada di `auth.users` tapi tidak ada di `public.users`
**Solusi**: User harus registrasi melalui form pendaftaran

### 2. Error saat login
**Penyebab**: RLS policies atau trigger tidak berjalan
**Solusi**: Jalankan SQL fix di `scripts/fix_oauth_user_creation.sql`

### 3. User tidak bisa login padahal data lengkap
**Penyebab**:
- Function `checkUserRegistrationComplete` menggunakan `.single()` yang error jika tidak ketemu
- Ada masalah dengan RLS policies

## Debugging

### 1. Cek user di database
```bash
node scripts/check_user.js email@example.com
```

### 2. Cek auth user
```bash
node scripts/check_auth_user.js email@example.com
```

### 3. Apply database fix
1. Buka Supabase SQL Editor
2. Jalankan script dari `scripts/fix_oauth_user_creation.sql`

## Security Notes

1. **Tidak ada pembuatan user otomatis**: User harus registrasi manual
2. **RLS Policies**: Semua akses ke tabel users dibatasi
3. **Session validation**: Setiap session dicek ke database
4. **Logout otomatis**: User tidak terdaftar akan di-sign out

## Pendaftaran User Baru

1. User mengisi form pendaftaran di `/pendaftaran`
2. Data disimpan ke tabel `users`
3. User login dengan Google OAuth
4. System menemukan user di database dan mengizinkan login