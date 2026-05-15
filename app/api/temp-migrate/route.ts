import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase.ts';

export async function POST() {
  try {
    const supabase = createSupabaseAdmin();
    const sql = `
-- Create muallimah_akads table
CREATE TABLE IF NOT EXISTS muallimah_akads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    
    -- Akad specific fields
    preferred_juz TEXT NOT NULL,
    preferred_schedule TEXT NOT NULL,
    backup_schedule TEXT,
    max_thalibah INTEGER,
    
    -- Paid class fields
    wants_paid_class BOOLEAN DEFAULT false,
    paid_class_details TEXT,
    
    -- Metadata
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'review', 'approved', 'rejected', 'waitlist')),
    understands_commitment BOOLEAN DEFAULT false,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES public.users(id),
    review_notes TEXT,
    
    -- Constraints
    CONSTRAINT muallimah_akads_unique_user_batch UNIQUE(user_id, batch_id)
);

-- Enable RLS
ALTER TABLE muallimah_akads ENABLE ROW LEVEL SECURITY;

-- Policies
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'muallimah_akads' AND policyname = 'Users can view own muallimah akads') THEN
        CREATE POLICY "Users can view own muallimah akads" ON muallimah_akads FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'muallimah_akads' AND policyname = 'Users can insert own muallimah akads') THEN
        CREATE POLICY "Users can insert own muallimah akads" ON muallimah_akads FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'muallimah_akads' AND policyname = 'Users can update own pending muallimah akads') THEN
        CREATE POLICY "Users can update own pending muallimah akads" ON muallimah_akads FOR UPDATE USING (auth.uid() = user_id AND status IN ('pending', 'review'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'muallimah_akads' AND policyname = 'Admins can manage muallimah akads') THEN
        CREATE POLICY "Admins can manage muallimah akads" ON muallimah_akads FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND 'admin' = ANY(roles)));
    END IF;
END
\$\$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_muallimah_akads_user_id ON muallimah_akads(user_id);
CREATE INDEX IF NOT EXISTS idx_muallimah_akads_batch_id ON muallimah_akads(batch_id);
CREATE INDEX IF NOT EXISTS idx_muallimah_akads_status ON muallimah_akads(status);

-- Make batch_id nullable in muallimah_registrations
ALTER TABLE muallimah_registrations ALTER COLUMN batch_id DROP NOT NULL;

-- Fix legacy NOT NULL columns in muallimah_registrations
  ALTER TABLE public.muallimah_registrations 
  ALTER COLUMN birth_date DROP NOT NULL,
  ALTER COLUMN birth_place DROP NOT NULL,
  ALTER COLUMN address DROP NOT NULL,
  ALTER COLUMN education DROP NOT NULL,
  ALTER COLUMN memorization_level DROP NOT NULL,
  ALTER COLUMN preferred_juz DROP NOT NULL,
  ALTER COLUMN teaching_experience DROP NOT NULL,
  ALTER COLUMN preferred_schedule DROP NOT NULL,
  ALTER COLUMN backup_schedule DROP NOT NULL;

-- Ensure user_id is unique in muallimah_registrations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'muallimah_registrations_user_id_key') THEN
        ALTER TABLE public.muallimah_registrations ADD CONSTRAINT muallimah_registrations_user_id_key UNIQUE (user_id);
    END IF;
END
$$;

-- Add muallimah_akad_text to batches
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS muallimah_akad_text TEXT;

-- Update existing Batch 2 with the current hardcoded text (if name matches)
UPDATE public.batches 
SET muallimah_akad_text = '📝 Formulir ini adalah formulir pendaftaran Mu''allimah MTI Batch 2

📆 Durasi program: InsyaAllah selama 13 Pekan dimulai dari tanggal 5 Januari - 5 April 2026 untuk target hafalan 1/2 juz.

Pekan 1 (5-11 Januari): Tashih
Pekan 2-11 (12 Januari - 5 April): Ziyadah
(Catatan: 15-29 Maret adalah Libur Lebaran)
Pekan 12 (6-12 April): Muroja''ah
Pekan 13 (13-19 April): Ujian

🎯 Target hafalan harian: 1 halaman perpekan (1/4 halaman per hari, 4 hari dalam sepekan)

✅ Tashih wajib sekali sepekan untuk kurikulum ziyadah pekan depan, jadwal menyesuaikan
✅ Ujian wajib sekali sepekan untuk kurikulum selesai ziyadah pekanan, jadwal menyesuaikan

🤝 Komitmen & Etika
Program ini adalah program gratis untuk ummat, MTI belum bisa menjanjikan ujrah apapun untuk partisipasi mu''allimaty dalam program ini.

Apapun keluhan dan keberatan pribadi yang dirasakan selama program berlangsung, mohon langsung komunikasikan kepada kak Mara (081313650842) untuk mendapatkan solusi.

Untuk masalah teknis link zoom silahkan langsung komunikasikan kepada kak Ucy (082229370282).

Untuk masalah perizinan udzur silahkan ke musyrifah masing-masing. (diharapkan info udzur disampaikan minimal 1 jam sebelum kelas, untuk meminimalisir kekecewaan tholibah)

Karena ini program gratis, apabila mu''allimaty ada udzur, MTI tidak menuntut untuk mengganti jadwal kelas, Tholibah akan kami arahkan untuk masuk kelas-kelas umum di MTI

Untuk Mu''allimaty yang telah mempunyai 2 kelas gratis di MTI, boleh membuka kelas berbayar sesuai dengan keahlian masing-masing di MTI dengan SPP kelas 100 persen untuk mu''allimaty tanpa dipotong MTI.

Program ini baru angkatan kedua dan gratis, kami akui masih banyak kekurangan/ketidaksempurnaan di sana-sini, kami berusaha melakukan semaksimal mungkin energi kami untuk program ini, tapi kami tidak melayani tuntutan professionalisme berlebih atau kesempurnaan. MTI adalah rumah bagi kita, yang anggotanya adalah keluarga bagaikan ibu dengan anak, kakak dengan adik, yang saling menyayangi, mengingatkan, melengkapi kelemahan dan kekurangan masing-masing untuk kebaikan denqan target semoga Allah kumpulkan kita di Jannah Firdaus Al''Ala. 

Formulir ini sebagai akad yang akan diperbaharui setiap batch atau angkatan sehingga mu''allimah hanya terikat dengan komitmen di MTI hanya dalam 11 pekan kurikulum per periode.

Apabila kurikulum telah selesai, mu''allimah bebas untuk melanjutkan jika masih berkenan dan nyaman dengan MTI, cuti apabila ada udzur atau mundur apabila sudah tidak berkenan.

Semoga Allah memudahkan langkah kita ikut andil dalam penjagaan A-Quran dan semoga Allah Ta''ala terima sebagai amal jariyah yang mengalir hingga hari kiamat, Aamiin. 🌿

Rangkuman Akad:
# Program ini gratis, MTI tidak bisa menjanjikan ujrah apapun
# Formulir ini sebagai akad yang berlaku selama 11 pekan kurikulum
# Komplain silakan ke Kak Mara (0813-1365-0842)
# Masalah teknis zoom ke Kak Ucy (082229370282)
# Izin udzur ke musyrifah minimal 1 jam sebelum kelas
# Apabila ada udzur, MTI tidak menuntut mengganti jadwal
# Muallimah dengan 2 kelas gratis boleh buka kelas berbayar
Pembagian SPP untuk kelas berbayar:
100% - Tanpa Musyrifah (muallimah mengelola kelas secara mandiri)
80% - Didampingi Musyrifah (ada musyrifah yang membantu mengelola kelas)
60% - Jika memiliki 1 kelas gratis di MTI (insentif khusus)
# Setelah kurikulum selesai, muallimah bebas melanjutkan/cuti/mundur pada angkatan berikutnya'
WHERE name ILIKE '%Batch 2%' AND muallimah_akad_text IS NULL;
`;

    // Try both parameter names
    let result = await supabase.rpc('exec_sql', { sql_query: sql });
    if (result.error) {
      console.log('Retrying with "sql" parameter...');
      result = await supabase.rpc('exec_sql', { sql: sql });
    }
    
    if (result.error) {
       // Try admin_exec_sql
       console.log('Retrying with admin_exec_sql...');
       result = await supabase.rpc('admin_exec_sql', { sql_query: sql });
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
