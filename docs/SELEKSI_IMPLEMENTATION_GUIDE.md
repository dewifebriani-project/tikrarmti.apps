# Implementasi Fitur Seleksi Tikrar Tahfidz

## Ringkasan
Fitur seleksi telah diimplementasikan untuk memungkinkan calon thalibah menyelesaikan 2 tahapan seleksi:
1. **Rekam Suara** - Ujian lisan membaca Al-Qur'an
2. **Pilihan Ganda** - Ujian tulisan tentang Al-Qur'an

## Struktur Database

### Tabel yang Digunakan
1. **`pendaftaran_tikrar_tahfidz`** - Tabel utama untuk data pendaftaran dan tracking seleksi (262 records)

   Kolom tambahan untuk tracking seleksi:
   - `oral_submission_url` - URL audio rekaman suara
   - `oral_submission_file_name` - Nama file audio
   - `oral_submitted_at` - Tanggal submit audio
   - `written_quiz_answers` - Jawaban quiz pilihan ganda (JSON)
   - `written_quiz_score` - Score quiz
   - `written_quiz_total_questions` - Total pertanyaan
   - `written_quiz_correct_answers` - Jawaban benar
   - `written_submitted_at` - Tanggal submit quiz
   - `selection_completed_at` - Tanggal selesainya semua seleksi

### Storage
- **`selection-audios`** - Bucket untuk menyimpan file audio rekaman suara

## Langkah-langkah Setup

### 1. Jalankan SQL di Supabase Dashboard

Buka Supabase Dashboard → SQL Editor, lalu jalankan SQL berikut:

#### a. Tambah kolom seleksi ke tabel `pendaftaran_tikrar_tahfidz`
```sql
-- Copy dari file: scripts/add_selection_columns_to_pendaftaran.sql
```

#### b. Buat storage bucket untuk audio
```sql
-- Bagian ini sudah ada di SQL di atas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'selection-audios'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'selection-audios',
      'selection-audios',
      true,
      10485760, -- 10MB
      ARRAY['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mpeg']
    );
  END IF;
END
$$;
```

### 3. Restart aplikasi
Aplikasi berjalan di: **http://localhost:3006**

## Cara Penggunaan

### Untuk Admin:
1. Login sebagai admin
2. Buka halaman: **http://localhost:3006/admin**
3. Pergi ke tab "Tikrar Tahfidz"
4. Klik tombol **Approve** untuk aplikasi yang statusnya "pending"
5. Setelah di-approve, calon thalibah dapat mengakses tahapan seleksi

### Untuk Calon Thalibah:
1. Login dengan akun calon thalibah
2. Buka halaman: **http://localhost:3006/perjalanan-saya**
3. Jika sudah di-approve oleh admin, card "Seleksi" akan menampilkan 2 tahapan
4. Klik pada masing-masing tahapan untuk menyelesaikan ujian

## Flow Proses

1. **Pendaftaran** → User mendaftar di halaman pendaftaran
2. **Admin Approval** → Admin approve aplikasi di dashboard
3. **Tahapan Seleksi Terbuka** → Card seleksi menampilkan 2 tahapan
4. **Rekam Suara** → User rekam bacaan Al-Qur'an
5. **Pilihan Ganda** → User kerjakan quiz 10 pertanyaan
6. **Status Update** → Status berubah menjadi "selection_submitted"
7. **Lulus Seleksi** → Admin akan menilai dan mengupdate status kelulusan

## Troubleshooting

### Jika tombol Approve/Reject tidak muncul:
- Pastikan user login sebagai admin
- Pastikan role user di tabel users adalah 'admin'

### Jika card seleksi tidak terbuka:
- Pastikan aplikasi sudah di-approve oleh admin
- Pastikan status di tabel pendaftaran_tikrar_tahfidz adalah 'approved'

### Jika error saat submit audio:
- Pastikan bucket 'selection-audios' sudah dibuat
- Pastikan RLS policies sudah diatur dengan benar

## API Endpoints

- `POST /api/tikrar/approve` - Approve/reject aplikasi
- `POST /api/seleksi/submit` - Submit hasil seleksi
- `GET /api/seleksi/submit` - Get status seleksi user

## File yang Ditambah/Dimodifikasi

1. **Halaman UI:**
   - `/app/seleksi/rekam-suara/page.tsx` - Halaman rekam suara
   - `/app/seleksi/pilihan-ganda/page.tsx` - Halaman pilihan ganda
   - `/app/perjalanan-saya/page.tsx` - Modifikasi card seleksi

2. **API:**
   - `/app/api/tikrar/approve/route.ts` - Endpoint approve/reject
   - `/app/api/seleksi/submit/route.ts` - Endpoint submit seleksi

3. **Script:**
   - `scripts/add_selection_columns_to_pendaftaran.sql` - SQL untuk menambah kolom seleksi

## Catatan Tambahan

- Aplikasi hanya menggunakan satu tabel `pendaftaran_tikrar_tahfidz` untuk data pendaftaran, admin dashboard, dan tracking seleksi
- Audio rekaman disimpan di Supabase Storage dengan maksimal 10MB per file
- Status seleksi akan otomatis berubah menjadi 'completed' jika kedua tahapan sudah diselesaikan
- Tidak perlu tabel tambahan `selection_submissions` - semua data ada di satu tabel