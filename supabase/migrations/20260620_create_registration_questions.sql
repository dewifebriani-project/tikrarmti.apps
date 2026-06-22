-- Migration: Create registration_questions table for Tikrar Tahfidz Form Builder
-- Date: 2026-06-20
-- Description: Create table for dynamic pendaftaran tikrar questions and seed the current form content

CREATE TABLE IF NOT EXISTS public.registration_questions (
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
ALTER TABLE public.registration_questions ENABLE ROW LEVEL SECURITY;

-- Select policy: Viewable by authenticated users (or anyone if needed, let's allow anyone)
CREATE POLICY "Registration questions are viewable by everyone"
  ON public.registration_questions
  FOR SELECT
  USING (true);

-- Insert/Update/Delete policy: Only admin
CREATE POLICY "Only admins can modify registration questions"
  ON public.registration_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.roles @> ARRAY['admin'::text]
    )
  );

-- Seed initial questions from current static form
INSERT INTO public.registration_questions (field_key, section, label, description, warning_text, is_active, is_required, sort_order, options)
VALUES
  (
    'commitment_info',
    1,
    '🤝 Komitmen & Etika',
    '• Program ini melibatkan banyak pihak dan pasangan setoran. Kami berusaha menyesuaikan jadwal dengan pilihan Ukhti sendiri.
• Harap meluruskan niat, menjaga komitmen, tidak banyak mengeluh, dan tidak mementingkan diri sendiri
• Jaga adab kepada seluruh tim Tikrar MTI dan pasangan setoran masing-masing
• Keputusan kelulusan tes administrasi dan bacaan bersifat final dan tidak dapat diganggu gugat
• Program ini baru 3 angkatan, kami akui masih banyak kekurangan/ketidaksempurnaan di sana-sini, kami berusaha melakukan semaksimal mungkin energi kami untuk program ini.
• Kami tidak melayani tuntutan professionalisme berlebih atau kesempurnaan seakan kami menjual jasa dengan harga tarif professional, kami hanya kumpulan emak-emak yang berkomitmen ingin emak-emak se-bumi Allah merasakan nikmatnya berproses menghafal Al Quran dengan metode tikrar, merasakan nikmatnya berkomunitas dengan sahabat-sahabat Al Quran. Sebagaimana yang telah kami rasakan dari guru-guru kami.
• MTI adalah rumah bagi kita, yang anggotanya adalah keluarga bagaikan ibu dengan anak, kakak dengan adik, yang saling melengkapi kelemahan dan kekurangan masing-masing untuk kebaikan denqan target berkumpul di Jannah Firdaus Al-''Ala. (No Baper, No Drama).',
    NULL,
    true,
    false,
    1,
    '[]'::jsonb
  ),
  (
    'understands_commitment',
    1,
    'Apakah Ukhti sudah faham dengan semua poin di atas dan bersedia menerima segala komitmen?',
    'Bismillah.. Alhamdulillah ana sudah dengar dan sudah paham dan insyaAllah ikhlas menerima segala komitmen and berusaha menjalankannya semaksimal mungkin.',
    NULL,
    true,
    true,
    2,
    '[]'::jsonb
  ),
  (
    'tried_simulation',
    1,
    'Apakah Ukhti sudah mencoba simulasi mengulang membaca Surat An-Naba'' ayat 1-11 sebanyak 40X',
    'Alhamdulillah saya sudah mencoba simulasi mengulang membaca Surat An-Naba'' ayat 1-11 sebanyak 40X',
    'Kami tidak melayani calon tolibah yang nego-nego jumlah tikrar, walaupun Ukhti hanya ingin murojaah/sudah pernah hafal.',
    true,
    true,
    3,
    '[]'::jsonb
  ),
  (
    'no_negotiation',
    1,
    'Saya berjanji ga akan nego-nego jumlah tikrar',
    'Bismillah.. Alhamdulillah sudah dan saya berjanji ga akan nego-nego jumlah tikrar',
    'Kami tidak melayani calon tolibah yang nego-nego jumlah tikrar, walaupun Ukhti hanya ingin muroja''ah/sudah pernah hafal.',
    true,
    true,
    4,
    '[]'::jsonb
  ),
  (
    'has_telegram',
    1,
    'Apakah Ukhti sudah faham jika program ini juga mewajibkan tholibah untuk mempunyai aplikasi telegram untuk proses seleksi?',
    'Bismillah.. Alhamdulillah saya sudah download telegram di hp saya',
    'Mohon maaf kami tidak akan mengecek VN seleksi yang dikirim lewat whatsapp jika ada kendala pada aplikasi, karena keterbatasan memori hp admin.',
    true,
    true,
    5,
    '[]'::jsonb
  ),
  (
    'saved_contact',
    1,
    'Apakah Ukhti sudah simpan nomor Whatsapp Admin Kak Mara 0813-1365-0842, Uni Dewi 0856-771-2914, Kak Dewi Nurhayati 0895-1898-4279, Kak Donna 0812-1224-0079, Kak Ucy 0822-2937-0282, Kak Lina 0853-4011-4111, Kak Vivi 0857-0623-2865, Kak Wara 0822-2010-0262?',
    'Bismillah.. Alhamdulillah saya sudah simpan nomor hp Kak Mara, Uni Dewi, dan admin lainnya.',
    'Yang akan di-add ke grup hanya yang bisa langsung kak Mara add saja.. kami tidak akan mengirimkan invitation link bagi yang tidak bisa di-add karena tidak mau save nomor admin.',
    true,
    true,
    6,
    '[]'::jsonb
  ),
  (
    'has_permission',
    2,
    'Apakah Ukhti sudah meminta izin kepada suami/ orang tua/majikan/wali yang bertanggung jawab atas diri Ukhti?',
    '(Jika belum silahkan minta izin, jika tidak diizinkan mohon bersabar, berdoa kepada Allah semoga Allah mudahkan pada angkatan selanjutnya)',
    NULL,
    true,
    true,
    6,
    '[
      {"value": "yes", "label": "Bismillah.. Alhamdulillah sudah (ini jawaban saya sejujur-jujurnya yang akan saya pertanggungjawabkan di akhirat nanti)"},
      {"value": "janda", "label": "Bismillah.. Saya seorang janda yang mandiri, tidak terikat, tidak perlu persetujuan siapapun dan mengikuti program ini tidak akan mempengaruhi siapapun"}
    ]'::jsonb
  ),
  (
    'permission_name',
    2,
    'Nama suami/ orang tua/majikan/wali yang bertanggung jawab atas diri Ukhti dan yang sudah memberikan izin Ukhti untuk ikut program ini',
    'Ketik nama sesuai KTP',
    NULL,
    true,
    false, -- validation logic sets this manually in code, let''s default database flag to false
    7,
    '[]'::jsonb
  ),
  (
    'permission_phone',
    2,
    'No HP suami/ orang tua/majikan/wali yang bertanggung jawab atas diri Ukhti dan yang sudah memberikan izin Ukhti untuk ikut program ini',
    '08xx-xxxx-xxxx',
    NULL,
    true,
    false,
    8,
    '[]'::jsonb
  ),
  (
    'chosen_juz',
    2,
    'Pilihan juz yang akan dihafalkan',
    'Pilih salah satu pilihan juz yang dibuka',
    NULL,
    true,
    true,
    9,
    '[]'::jsonb
  ),
  (
    'no_travel_plans',
    2,
    'Apakah Ukhti sudah merencanakan atau safar, mudik, umrah atau liburan di luar jadwal liburan MTI?',
    'InsyaAllah saya tidak ada rencana safar, kalaupun tiba-tiba safar saya akan bertanggungjawab memprioritaskan waktu untuk memenuhi kewajiban setoran kepada pasangan',
    'Program ini akan insyaAllah biidznillah akan dilaksanakan selama 13 pekan. Apabila Ukhti sudah merencanakan atau safar, mudik, umrah atau liburan di luar jadwal liburan MTI yang menyesuaikan dengan liburan anak-anak sekolah, kami sarankan menunda pendaftaran pada angkatan berikutnya. Kami tidak menerima alasan mudik/safar yang mendzholimi jadwal pasangan setoran Ukhti.',
    true,
    true,
    10,
    '[]'::jsonb
  ),
  (
    'motivation',
    2,
    'Ketikkan secara singkat apa motivasi terbesar Ukhti untuk menghafal Al-Quran sehingga Ukhti rela mengikuti program ini dan ikhlas menjalankan semua aturan-peraturan dari MTI?',
    'Jelaskan motivasi Ukhti...',
    NULL,
    true,
    true,
    11,
    '[]'::jsonb
  ),
  (
    'ready_for_team',
    2,
    'Apakah Ukhti siap dan bersedia menjadi bagian tim MTI apabila kami anggap sudah layak menjadi khadimat Al-Quran sebagai mu''allimah atau musyrifah untuk turut membantu MTI dalam misi memberantas buta huruf Al-Quran di Indonesia?',
    'Opsi komitmen khidmat / infaq bulanan thalibah.',
    NULL,
    true,
    true,
    12,
    '[
      {"value": "ready", "label": "InsyaAllah siapppp (jawaban ini kami catat sebagai akad)"},
      {"value": "infaq", "label": "Afwan saya tidak bisa menjadi tim MTI dikarenakan kesibukan dan komitmen di lembaga lain, sebagai gantinya saya akan akad infaq wajib perbulan dengan pilihan 25, 50, 100 atau lebih dari 100 ribu rupiah perbulan..."}
    ]'::jsonb
  ),
  (
    'main_time_slot',
    3,
    'Pilih waktu utama untuk jadwal setoran dengan pasangan',
    'Pilih waktu utama',
    NULL,
    true,
    true,
    13,
    '[]'::jsonb
  ),
  (
    'backup_time_slot',
    3,
    'Pilih waktu cadangan untuk jadwal setoran dengan pasangan',
    'Pilih waktu cadangan',
    NULL,
    true,
    true,
    14,
    '[]'::jsonb
  ),
  (
    'time_commitment',
    3,
    'Akad waktu',
    'Saya sudah memilih jadwal waktu utama dan cadangan dengan mempertimbangkan jadwal harian dan kegiatan saya. Saya terima ini sebagai akad yang akan saya pertanggungjawabkan di hadapan Allah apabila saya mendzolimi waktu pasangan setoran saya dengan alasan-alasan yang tidak urgen.',
    NULL,
    true,
    true,
    15,
    '[]'::jsonb
  ),
  (
    'understands_program',
    4,
    'Apakah Ukhti faham dengan poin-poin di atas?',
    'Memahami kewajiban tashih, ujian, ziyadah, murojaah, dan ketentuan Counter Manual / Al-Qur''an Tikrar.',
    NULL,
    true,
    true,
    16,
    '[]'::jsonb
  ),
  (
    'questions',
    4,
    'Silahkan ketik pertanyaan Ukhti apabila ada yang masih kurang faham',
    'Ketik pertanyaan Ukhti di sini (kosongkan jika tidak ada)',
    NULL,
    true,
    false,
    17,
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
