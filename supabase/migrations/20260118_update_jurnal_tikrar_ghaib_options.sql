-- =====================================================
-- UPDATE JURNAL RECORDS - ADD TIKRAR GHAIB OPTIONS
-- =====================================================
-- Add columns for tikrar ghaib options with multiselect support
-- Options: pasangan_40, keluarga_40, tarteel_40, pasangan_20, voice_note_20
-- =====================================================

-- Add new columns to jurnal_records table
ALTER TABLE public.jurnal_records
  ADD COLUMN IF NOT EXISTS tikrar_bi_al_ghaib_40x TEXT[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tikrar_bi_al_ghaib_20x TEXT[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tarteel_screenshot_url TEXT DEFAULT NULL;

-- Add check constraints to ensure only valid values
ALTER TABLE public.jurnal_records
  DROP CONSTRAINT IF EXISTS jurnal_records_tikrar_bi_al_ghaib_40x_check,
  ADD CONSTRAINT jurnal_records_tikrar_bi_al_ghaib_40x_check
    CHECK (tikrar_bi_al_ghaib_40x IS NULL OR array_length(tikrar_bi_al_ghaib_40x, 1) = 0 OR
           tikrar_bi_al_ghaib_40x <@ ARRAY['pasangan_40', 'keluarga_40', 'tarteel_40']::TEXT[]);

ALTER TABLE public.jurnal_records
  DROP CONSTRAINT IF EXISTS jurnal_records_tikrar_bi_al_ghaib_20x_check,
  ADD CONSTRAINT jurnal_records_tikrar_bi_al_ghaib_20x_check
    CHECK (tikrar_bi_al_ghaib_20x IS NULL OR array_length(tikrar_bi_al_ghaib_20x, 1) = 0 OR
           tikrar_bi_al_ghaib_20x <@ ARRAY['pasangan_20', 'voice_note_20']::TEXT[]);

-- Add comments
COMMENT ON COLUMN public.jurnal_records.tikrar_bi_al_ghaib_40x IS 'Tikrar ghaib 40x options (can select one or more): pasangan_40, keluarga_40, tarteel_40';
COMMENT ON COLUMN public.jurnal_records.tikrar_bi_al_ghaib_20x IS 'Tikrar ghaib 20x options (multiselect allowed): pasangan_20, voice_note_20';
COMMENT ON COLUMN public.jurnal_records.tarteel_screenshot_url IS 'URL of Tarteel app screenshot proof (required when tarteel_40 is selected)';
