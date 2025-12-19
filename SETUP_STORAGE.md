# Setup Supabase Storage untuk Audio Seleksi

## 1. Buat Storage Bucket

1. Buka **Supabase Dashboard**: https://supabase.com/dashboard
2. Pilih project Anda
3. Klik **Storage** di sidebar kiri
4. Klik **New Bucket**
5. Isi form:
   - **Name**: `selection-audios`
   - **Public**: ✅ Centang (agar file bisa diakses publik)
   - **File size limit**: 10 MB (opsional)
   - **Allowed MIME types**: `audio/webm, audio/wav, audio/mp3` (opsional)
6. Klik **Create Bucket**

## 2. Set Storage Policies

Setelah bucket dibuat, set policies agar:
- Authenticated users bisa **upload** (INSERT)
- Public bisa **read** (SELECT)

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'selection-audios');

-- Allow public to read
CREATE POLICY "Public can read audio"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'selection-audios');
```

## 3. Verifikasi Database Columns

Pastikan tabel `pendaftaran_tikrar_tahfidz` memiliki kolom:
- `oral_submission_url` (text)
- `oral_submission_file_name` (text)
- `oral_submitted_at` (timestamptz)
- `written_quiz_answers` (jsonb)
- `written_quiz_score` (integer)
- `written_quiz_total_questions` (integer)
- `written_quiz_correct_answers` (integer)
- `written_quiz_submitted_at` (timestamptz)
- `selection_status` (text, default: 'pending')

Jika belum ada, tambahkan dengan SQL:

```sql
ALTER TABLE pendaftaran_tikrar_tahfidz
ADD COLUMN IF NOT EXISTS oral_submission_url TEXT,
ADD COLUMN IF NOT EXISTS oral_submission_file_name TEXT,
ADD COLUMN IF NOT EXISTS oral_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS written_quiz_answers JSONB,
ADD COLUMN IF NOT EXISTS written_quiz_score INTEGER,
ADD COLUMN IF NOT EXISTS written_quiz_total_questions INTEGER,
ADD COLUMN IF NOT EXISTS written_quiz_correct_answers INTEGER,
ADD COLUMN IF NOT EXISTS written_quiz_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS selection_status TEXT DEFAULT 'pending';
```

## Testing

Setelah setup selesai, coba:
1. Rekam audio di halaman `/seleksi/rekam-suara`
2. Submit rekaman
3. Periksa console log server (terminal Next.js) untuk debug info
4. Jika berhasil, file akan muncul di Supabase Storage dan URL tersimpan di database
