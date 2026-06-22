-- Migration: Create reregistration_questions table for Tikrar Tahfidz Form Builder
-- Date: 2026-06-20
-- Description: Create table for dynamic daftar ulang (re-registration) tikrar questions and seed the current form content

CREATE TABLE IF NOT EXISTS public.reregistration_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_key text NOT NULL UNIQUE,
  section integer NOT NULL DEFAULT 1,
  label text NOT NULL,
  description text,
  warning_text text,
  is_active boolean NOT NULL DEFAULT true,
  is_required boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  options jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reregistration_questions ENABLE ROW LEVEL SECURITY;

-- Select policy: Viewable by everyone
CREATE POLICY "Reregistration questions are viewable by everyone"
  ON public.reregistration_questions
  FOR SELECT
  USING (true);

-- Insert/Update/Delete policy: Only admin
CREATE POLICY "Only admins can modify reregistration questions"
  ON public.reregistration_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.roles @> ARRAY['admin'::text]
    )
  );

-- Seed initial questions from current static form
INSERT INTO public.reregistration_questions (field_key, section, label, description, warning_text, is_active, is_required, sort_order, options)
VALUES
  (
    'confirmed_full_name',
    1,
    'Nama Lengkap',
    'Pastikan nama lengkap sudah benar sesuai KTP',
    NULL,
    true,
    true,
    1,
    '[]'::jsonb
  ),
  (
    'confirmed_wa_phone',
    1,
    'WhatsApp',
    'Ganti nomor WhatsApp jika ada perubahan',
    NULL,
    true,
    true,
    2,
    '[]'::jsonb
  ),
  (
    'confirmed_address',
    1,
    'Alamat',
    'Alamat tempat tinggal saat ini',
    NULL,
    true,
    true,
    3,
    '[]'::jsonb
  ),
  (
    'schedule_instructions',
    2,
    'Pilih Jadwal Halaqah',
    'Pilih jadwal untuk kelas ujian dan/atau kelas tashih. Waktu yang ditampilkan dalam WIB.',
    NULL,
    true,
    true,
    4,
    '[]'::jsonb
  ),
  (
    'partner_type',
    3,
    'Pilih Pasangan Belajar',
    'Pilih pasangan belajar untuk program Tikrar Tahfidz',
    NULL,
    true,
    true,
    5,
    '[]'::jsonb
  ),
  (
    'partner_self_match',
    3,
    'Pilih Sendiri',
    'Pilih pasangan belajar sendiri. Pasangan harus saling memilih untuk membentuk kelompok. Bisa lintas juz.',
    NULL,
    true,
    true,
    6,
    '[]'::jsonb
  ),
  (
    'partner_system_match',
    3,
    'Dipasangkan oleh Sistem',
    'Sistem akan memasangkan Anda berdasarkan jadwal utama, zona waktu, dan juz.',
    NULL,
    true,
    true,
    7,
    '[]'::jsonb
  ),
  (
    'partner_family',
    3,
    'Keluarga (Mahram)',
    'Setoran kepada keluarga (Ayah, Ibu, anak, atau saudara mahram).',
    NULL,
    true,
    true,
    8,
    '[]'::jsonb
  ),
  (
    'partner_tarteel',
    3,
    'Aplikasi Tarteel',
    'Setoran mandiri menggunakan aplikasi Tarteel dengan lampiran screenshot penggunaan.',
    NULL,
    true,
    true,
    9,
    '[]'::jsonb
  ),
  (
    'akad_upload',
    4,
    'Upload Akad',
    'Silakan tulis tangan intisari akad di bawah ini, tandatangani, lalu upload hasil scan/fotonya.',
    'Tulis seluruh teks akad di atas dengan tangan pada kertas. Tandatangani di bagian bawah (tulis nama lengkap dan tanggal). Scan atau foto hasil tulisan tangan Anda. Upload file hasil scan/foto di bawah ini.',
    true,
    true,
    10,
    '[]'::jsonb
  )
ON CONFLICT (field_key) DO UPDATE
SET
  section = EXCLUDED.section,
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  warning_text = EXCLUDED.warning_text,
  is_active = EXCLUDED.is_active,
  is_required = EXCLUDED.is_required,
  sort_order = EXCLUDED.sort_order,
  options = EXCLUDED.options;
