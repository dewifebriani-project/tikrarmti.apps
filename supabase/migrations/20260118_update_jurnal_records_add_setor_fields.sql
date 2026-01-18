-- =====================================================
-- UPDATE JURNAL RECORDS TABLE - ADD SETOR FIELDS
-- =====================================================
-- Add fields for juz_code, tanggal_setor, blok, and tikrar_bi_al_ghaib_type
-- =====================================================

-- Add new columns to jurnal_records table
ALTER TABLE public.jurnal_records
  ADD COLUMN IF NOT EXISTS tanggal_setor DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS juz_code VARCHAR(10),
  ADD COLUMN IF NOT EXISTS blok VARCHAR(20),
  ADD COLUMN IF NOT EXISTS tikrar_bi_al_ghaib_type VARCHAR(20) CHECK (tikrar_bi_al_ghaib_type IN ('sendiri', 'pasangan', 'voice_note'));

-- Add index for date filtering
CREATE INDEX IF NOT EXISTS idx_jurnal_records_tanggal_setor ON public.jurnal_records(tanggal_setor DESC);
CREATE INDEX IF NOT EXISTS idx_jurnal_records_juz_code ON public.jurnal_records(juz_code);

-- Add comments
COMMENT ON COLUMN public.jurnal_records.tanggal_setor IS 'Tanggal ketika jurnal setor dilakukan';
COMMENT ON COLUMN public.jurnal_records.juz_code IS 'Kode juz yang disetorkan (misal: 29A, 30B)';
COMMENT ON COLUMN public.jurnal_records.blok IS 'Blok yang disetorkan (misal: H1A, H2B)';
COMMENT ON COLUMN public.jurnal_records.tikrar_bi_al_ghaib_type IS 'Tipe tikrar ghaib: sendiri (40x), pasangan (20x), atau voice_note (20x)';
