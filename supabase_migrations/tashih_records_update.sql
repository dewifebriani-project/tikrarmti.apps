-- =====================================================
-- TASHIH RECORDS TABLE MIGRATION
-- =====================================================
-- This migration updates the tashih_records table to match
-- the requirements from the tashih page
-- =====================================================

-- Drop existing table if it exists (WARNING: This will delete existing data)
DROP TABLE IF EXISTS public.tashih_records CASCADE;

-- Create updated tashih_records table
CREATE TABLE public.tashih_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic tashih info
  blok VARCHAR(10) NOT NULL, -- H2a, H2b, H2c, H2d
  lokasi VARCHAR(20) NOT NULL, -- 'mti' or 'luar'

  -- Additional fields for luar location
  lokasi_detail TEXT, -- Detail lokasi when luar (e.g., "Masjid Al-Hikmah")
  nama_pemeriksa VARCHAR(255), -- Nama pemeriksa when luar

  -- Tajwid issues (stored as JSONB array)
  masalah_tajwid JSONB DEFAULT '[]'::JSONB,
  -- Examples: ["mad", "qolqolah", "ghunnah", "ikhfa", "idghom", "izhar", "waqaf", "makhroj", "sifat", "lainnya"]

  -- Additional notes
  catatan_tambahan TEXT,

  -- Timestamp
  waktu_tashih TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure one record per user per day using unique index on computed date
CREATE UNIQUE INDEX unique_tashih_per_day ON public.tashih_records(user_id, DATE(waktu_tashih));

-- Create indexes for better query performance
CREATE INDEX idx_tashih_records_user_id ON public.tashih_records(user_id);
CREATE INDEX idx_tashih_records_waktu_tashih ON public.tashih_records(waktu_tashih DESC);
CREATE INDEX idx_tashih_records_blok ON public.tashih_records(blok);

-- Enable Row Level Security
ALTER TABLE public.tashih_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own records
CREATE POLICY "Users can view own tashih records"
  ON public.tashih_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tashih records"
  ON public.tashih_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tashih records"
  ON public.tashih_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tashih records"
  ON public.tashih_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.tashih_records TO authenticated;
GRANT SELECT ON public.tashih_records TO anon;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tashih_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER tashih_records_updated_at
  BEFORE UPDATE ON public.tashih_records
  FOR EACH ROW
  EXECUTE FUNCTION update_tashih_records_updated_at();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.tashih_records IS 'Stores daily tashih (Quran reading validation) records for each thalibah';
COMMENT ON COLUMN public.tashih_records.blok IS 'Blok hafalan: H2a, H2b, H2c, H2d';
COMMENT ON COLUMN public.tashih_records.lokasi IS 'Lokasi tashih: mti (Markaz Tikrar Indonesia) or luar (outside MTI)';
COMMENT ON COLUMN public.tashih_records.lokasi_detail IS 'Detail lokasi when lokasi=luar, e.g., "Masjid Al-Hikmah"';
COMMENT ON COLUMN public.tashih_records.nama_pemeriksa IS 'Nama pemeriksa when lokasi=luar';
COMMENT ON COLUMN public.tashih_records.masalah_tajwid IS 'JSONB array of tajwid issues found, e.g., ["mad", "qolqolah", "ghunnah"]';
COMMENT ON COLUMN public.tashih_records.catatan_tambahan IS 'Additional notes about the tashih session';
COMMENT ON COLUMN public.tashih_records.waktu_tashih IS 'Timestamp when the tashih was performed';
