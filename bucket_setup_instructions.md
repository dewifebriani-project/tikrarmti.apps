# Setup Storage Bucket Manual Instructions

Karena error permissions, ikuti langkah berikut untuk setup storage bucket:

## 1. Create Bucket via Dashboard UI

1. Buka Supabase Dashboard
2. Go to **Storage** section
3. Click **"New bucket"**
4. Isi form:
   - **Name**: `selection-audios`
   - **Public bucket**: ✅ Check
   - **File size limit**: `10485760` (10MB)
   - **Allowed MIME types**: `audio/webm`, `audio/ogg`, `audio/wav`, `audio/mp3`, `audio/mpeg`

## 2. Set up RLS Policies

Setelah bucket dibuat, buka SQL Editor dan jalankan:

```sql
-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow anonymous users to read selection audios" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload selection audios" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own selection audios" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read selection audios" ON storage.objects;

-- Create policies
CREATE POLICY "Allow anonymous users to read selection audios"
ON storage.objects FOR SELECT
USING (bucket_id = 'selection-audios');

CREATE POLICY "Allow users to upload selection audios"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'selection-audios' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to update own selection audios"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'selection-audios' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to read selection audios"
ON storage.objects FOR SELECT
USING (bucket_id = 'selection-audios' AND auth.role() = 'authenticated');
```

## 3. Jalankan Database Updates

Setelah bucket siap, jalankan SQL dari `database_updates_simple.sql` untuk menambahkan field ke tabel.

## 4. Verifikasi

Pastikan:
- Bucket `selection-audios` muncul di Storage section
- Field-field baru ada di tabel `pendaftaran_tikrar_tahfidz`
- RLS policies terpasang di bucket