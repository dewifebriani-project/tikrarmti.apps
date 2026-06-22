-- Migration: Create muallimah_registration_questions table for Muallimah Form Builder
-- Date: 2026-06-20
-- Description: Create table for dynamic pendaftaran muallimah questions and seed the current form content

CREATE TABLE IF NOT EXISTS public.muallimah_registration_questions (
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
ALTER TABLE public.muallimah_registration_questions ENABLE ROW LEVEL SECURITY;

-- Select policy: Viewable by everyone
CREATE POLICY "Muallimah registration questions are viewable by everyone"
  ON public.muallimah_registration_questions
  FOR SELECT
  USING (true);

-- Insert/Update/Delete policy: Only admin
CREATE POLICY "Only admins can modify muallimah registration questions"
  ON public.muallimah_registration_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.roles @> ARRAY['admin'::text]
    )
  );

-- Seed initial questions from current static form
INSERT INTO public.muallimah_registration_questions (field_key, section, label, description, warning_text, is_active, is_required, sort_order, options)
VALUES
  -- Section 1: Profil & Latar Belakang
  (
    'tajweed_institution',
    1,
    'Lembaga Belajar Tajwid',
    'e.g. MTI, LTQ, dsb',
    NULL,
    true,
    true,
    1,
    '[]'::jsonb
  ),
  (
    'quran_institution',
    1,
    'Lembaga Tahfidz',
    'e.g. Markaz Tikrar, dsb',
    NULL,
    true,
    true,
    2,
    '[]'::jsonb
  ),
  (
    'teaching_communities',
    1,
    'Komunitas / Tempat Mengajar Saat Ini',
    'e.g. LTQ A, Majelis Taklim B, dsb (kosongkan jika tidak ada)',
    NULL,
    true,
    false,
    3,
    '[]'::jsonb
  ),
  (
    'memorized_tajweed_matan',
    1,
    'Matan Tajwid yang Dihafal',
    'e.g. Tuhfatul Athfal, Jazariyah',
    NULL,
    true,
    false,
    4,
    '[]'::jsonb
  ),
  (
    'studied_matan_exegesis',
    1,
    'Syarah Matan yang Dipelajari',
    'e.g. Aisar, dsb',
    NULL,
    true,
    false,
    5,
    '[]'::jsonb
  ),
  (
    'memorization_level',
    1,
    'Jumlah Hafalan Al-Quran saat ini (Juz)',
    'Pilih jumlah hafalan antara 1 sampai 30 juz',
    NULL,
    true,
    true,
    6,
    '[]'::jsonb
  ),
  (
    'memorized_juz',
    1,
    'Juz yang Sudah Dihafal',
    'Centang juz yang sudah dihafal',
    NULL,
    true,
    true,
    7,
    '[]'::jsonb
  ),
  (
    'examined_juz',
    1,
    'Juz yang Sudah Diuji (Tashih/Imtihan)',
    'Centang juz yang sudah diuji',
    NULL,
    true,
    false,
    8,
    '[]'::jsonb
  ),
  (
    'certified_juz',
    1,
    'Juz yang Sudah Mendapat Sertifikat',
    'Centang juz yang sudah mendapat sertifikat',
    NULL,
    true,
    false,
    9,
    '[]'::jsonb
  ),

  -- Section 2: Pilihan Program & Akad
  (
    'class_tikrar',
    2,
    'Kelas Tikrar',
    'Kelas hafalan Al-Quran berulang (standard/ziyadah).',
    NULL,
    true,
    true,
    10,
    '[]'::jsonb
  ),
  (
    'class_pratikrar',
    2,
    'Kelas Pra-Tikrar',
    'Kelas persiapan dan pembekalan materi tajwid/tashih dasar.',
    NULL,
    true,
    true,
    11,
    '[]'::jsonb
  ),
  (
    'class_paid',
    2,
    'Kelas Berbayar (Opsional)',
    'Mengajar kelas berbayar komersial sesuai kebijakan MTI.',
    NULL,
    true,
    false,
    12,
    '[]'::jsonb
  ),
  (
    'paid_class_scheme',
    2,
    'Pengajuan Skema Kelas Berbayar',
    'Pilih skema pengajuan kelas berbayar yang diajukan',
    NULL,
    true,
    false,
    13,
    '[]'::jsonb
  ),
  (
    'preferred_max_thalibah',
    2,
    'Maksimal Tholibah per Kelas',
    'Pilih kapasitas maksimal tholibah per kelas',
    NULL,
    true,
    true,
    14,
    '[]'::jsonb
  ),
  (
    'preferred_juz',
    2,
    'Juz yang Bersedia Diampu',
    'Pilih minimal satu juz yang ingin diampu',
    NULL,
    true,
    true,
    15,
    '[]'::jsonb
  ),
  (
    'teaching_schedule',
    2,
    'Jadwal Mengajar per Program (WIB)',
    'Tentukan jadwal mengajar utama dan cadangan untuk masing-masing kelas yang diampu.',
    NULL,
    true,
    true,
    16,
    '[]'::jsonb
  ),

  -- Section 3: Akad Komitmen & Etika Mu'allimah
  (
    'free_program',
    3,
    'Program ini gratis, MTI belum bisa menjanjikan ujrah apapun untuk partisipasi Mu''allimah.',
    NULL,
    NULL,
    true,
    true,
    17,
    '{"icon": "🎁"}'::jsonb
  ),
  (
    'standard_package',
    3,
    'Memahami bahwa kelas Standard adalah satu paket lengkap yang mencakup Tashih dan Ujian sekaligus.',
    NULL,
    NULL,
    true,
    true,
    18,
    '{"icon": "📦"}'::jsonb
  ),
  (
    'revenue_share',
    3,
    'Menyetujui skema kerjasama 80% (didampingi musyrifah) atau 60% (jika memiliki 1 kelas gratis) untuk kelas berbayar.',
    NULL,
    NULL,
    true,
    true,
    19,
    '{"icon": "🤝"}'::jsonb
  ),
  (
    'complaints_mara',
    3,
    'Keluhan dan keberatan pribadi dikomunikasikan langsung ke Kak Mara (081313650842).',
    NULL,
    NULL,
    true,
    true,
    20,
    '{"icon": "📞"}'::jsonb
  ),
  (
    'technical_ucy',
    3,
    'Masalah teknis link zoom dikomunikasikan langsung ke Kak Ucy (082229370282).',
    NULL,
    NULL,
    true,
    true,
    21,
    '{"icon": "💻"}'::jsonb
  ),
  (
    'permit_musyrifah',
    3,
    'Izin udzur disampaikan ke Musyrifah minimal 1 jam sebelum kelas dimulai.',
    NULL,
    NULL,
    true,
    true,
    22,
    '{"icon": "⏱️"}'::jsonb
  ),
  (
    'no_makeup_class',
    3,
    'Jika Mu''allimah udzur, MTI tidak menuntut ganti jadwal (Tholibah diarahkan ke kelas umum).',
    NULL,
    NULL,
    true,
    true,
    23,
    '{"icon": "📅"}'::jsonb
  ),
  (
    'paid_class_incentive',
    3,
    'Mu''allimah dengan 2 kelas gratis boleh buka kelas berbayar (SPP 100% tanpa potongan MTI).',
    NULL,
    NULL,
    true,
    true,
    24,
    '{"icon": "🌟"}'::jsonb
  ),
  (
    'family_spirit',
    3,
    'Menerima kekurangan program dengan semangat kekeluargaan dan saling melengkapi.',
    NULL,
    NULL,
    true,
    true,
    25,
    '{"icon": "❤️"}'::jsonb
  ),
  (
    'batch_period',
    3,
    'Akad berlaku selama satu periode (11 pekan kurikulum ziyadah + ujian).',
    NULL,
    NULL,
    true,
    true,
    26,
    '{"icon": "⏳"}'::jsonb
  ),
  (
    'freedom_to_continue',
    3,
    'Setelah kurikulum selesai, bebas untuk melanjutkan, cuti, atau mundur pada batch berikutnya.',
    NULL,
    NULL,
    true,
    true,
    27,
    '{"icon": "🕊️"}'::jsonb
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
