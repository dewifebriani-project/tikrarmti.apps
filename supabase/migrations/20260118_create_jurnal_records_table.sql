-- =====================================================
-- CREATE JURNAL RECORDS TABLE
-- =====================================================
-- Table untuk menyimpan record jurnal harian thalibah
-- Mengikuti pola tashih_records dengan prasyarat tashih
-- =====================================================

-- Create jurnal_records table
CREATE TABLE IF NOT EXISTS public.jurnal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tanggal jurnal
  tanggal_jurnal TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Prasyarat: harus sudah tashih hari ini
  tashih_completed BOOLEAN DEFAULT false,

  -- 7 Tahap Kurikulum Wajib
  rabth_completed BOOLEAN DEFAULT false,
  murajaah_count INTEGER DEFAULT 0 CHECK (murajaah_count >= 0),
  simak_murattal_count INTEGER DEFAULT 0 CHECK (simak_murattal_count >= 0),
  tikrar_bi_an_nadzar_completed BOOLEAN DEFAULT false,
  tasmi_record_count INTEGER DEFAULT 0 CHECK (tasmi_record_count >= 0),
  simak_record_completed BOOLEAN DEFAULT false,
  tikrar_bi_al_ghaib_count INTEGER DEFAULT 0 CHECK (tikrar_bi_al_ghaib_count >= 0),

  -- Kurikulum Tambahan (Pilihan)
  tafsir_completed BOOLEAN DEFAULT false,
  menulis_completed BOOLEAN DEFAULT false,

  -- Total waktu (dalam menit)
  total_duration_minutes INTEGER DEFAULT 0 CHECK (total_duration_minutes >= 0),

  -- Catatan tambahan
  catatan_tambahan TEXT,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jurnal_records_user_id ON public.jurnal_records(user_id);
CREATE INDEX IF NOT EXISTS idx_jurnal_records_tanggal_jurnal ON public.jurnal_records(tanggal_jurnal DESC);
CREATE INDEX IF NOT EXISTS idx_jurnal_records_user_date ON public.jurnal_records(user_id, tanggal_jurnal DESC);

-- Enable Row Level Security
ALTER TABLE public.jurnal_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Users can insert own jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Users can update own jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Users can delete own jurnal records" ON public.jurnal_records;

-- Create RLS policies
CREATE POLICY "Users can view own jurnal records"
  ON public.jurnal_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jurnal records"
  ON public.jurnal_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jurnal records"
  ON public.jurnal_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own jurnal records"
  ON public.jurnal_records FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_jurnal_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS jurnal_records_updated_at ON public.jurnal_records;
CREATE TRIGGER jurnal_records_updated_at
  BEFORE UPDATE ON public.jurnal_records
  FOR EACH ROW
  EXECUTE FUNCTION update_jurnal_records_updated_at();

-- Add comment
COMMENT ON TABLE public.jurnal_records IS 'Record jurnal harian thalibah untuk melacak progress kurikulum';
COMMENT ON COLUMN public.jurnal_records.tashih_completed IS 'Prasyarat: thalibah harus sudah tashih hari ini';
