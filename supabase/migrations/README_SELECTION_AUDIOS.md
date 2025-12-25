# Setup Storage Bucket untuk Rekam Suara Seleksi

## Cara Setup di Supabase Dashboard

### Langkah 1: Buka SQL Editor
1. Login ke [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Buka menu **SQL Editor** di sidebar kiri

### Langkah 2: Jalankan SQL Script
1. Klik **New Query**
2. Copy semua isi file `create_selection_audios_bucket.sql`
3. Paste ke SQL Editor
4. Klik **Run** atau tekan `Ctrl+Enter`

### Langkah 3: Verifikasi
1. Buka menu **Storage** di sidebar
2. Pastikan bucket `selection-audios` sudah muncul
3. Klik bucket tersebut
4. Klik tab **Policies** untuk melihat RLS policies yang sudah dibuat

## Penjelasan Policies

### Upload Policy (INSERT)
- User hanya bisa upload file dengan nama yang dimulai dengan user_id mereka
- Format: `{user_id}_alfath29_{timestamp}.webm`
- Contoh: `c862c410-0bee-4ac6-a3ca-53ac5b97277c_alfath29_1766689696944.webm`

### View Policy (SELECT)
- Semua authenticated users bisa view/download semua audio files
- Admin dan staff (musyrifah, muallimah) juga punya akses penuh

### Update/Delete Policy
- User hanya bisa update/delete file mereka sendiri
- Admin bisa delete semua files

## Bucket Configuration
- **Public**: Yes (untuk public URL access)
- **File Size Limit**: 10 MB (10,485,760 bytes)
- **Allowed MIME Types**:
  - audio/webm (primary format dari MediaRecorder)
  - audio/mpeg
  - audio/mp4
  - audio/ogg
  - audio/wav

## Testing
Setelah setup, test dengan:
1. Login ke aplikasi sebagai user dengan role `calon_thalibah`
2. Buka halaman `/seleksi/rekam-suara`
3. Rekam audio QS. Al-Fath ayat 29
4. Upload rekaman
5. Pastikan upload berhasil tanpa error 400

## Troubleshooting

### Error: "new row violates row-level security policy"
- Pastikan user sudah login (authenticated)
- Pastikan filename format benar: dimulai dengan UUID user
- Check policies sudah ter-apply dengan benar

### Error: "Bucket not found"
- Jalankan ulang script SQL
- Pastikan bucket name adalah `selection-audios` (huruf kecil, dengan dash)

### Error: "Payload too large"
- File audio > 10 MB
- User perlu rekam ulang dengan durasi lebih pendek
- Atau tingkatkan `file_size_limit` di bucket settings

## Manual Bucket Creation (Alternative)

Jika prefer manual setup via UI:

1. **Storage** → **New Bucket**
2. Bucket Name: `selection-audios`
3. Public bucket: **Yes**
4. File size limit: **10485760** (10 MB)
5. Allowed MIME types: `audio/webm,audio/mpeg,audio/mp4,audio/ogg,audio/wav`
6. Klik **Create Bucket**

Lalu tambahkan policies via SQL Editor (paste policy SQL saja, skip bagian CREATE BUCKET).

## Reference
- Supabase Storage Docs: https://supabase.com/docs/guides/storage
- RLS Policies: https://supabase.com/docs/guides/auth/row-level-security
