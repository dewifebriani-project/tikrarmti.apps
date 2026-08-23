-- Add rabth_methods and tafsir_options arrays to jurnal_records
ALTER TABLE public.jurnal_records
ADD COLUMN IF NOT EXISTS rabth_methods TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tafsir_options TEXT[] DEFAULT '{}';

-- Create CHECK constraint for rabth_methods
ALTER TABLE public.jurnal_records
ADD CONSTRAINT jurnal_records_rabth_methods_check
CHECK (rabth_methods IS NULL OR array_length(rabth_methods, 1) IS NULL OR rabth_methods <@ ARRAY['pasangan', 'tarteel', 'solat']::TEXT[]);

-- Create CHECK constraint for tafsir_options
ALTER TABLE public.jurnal_records
ADD CONSTRAINT jurnal_records_tafsir_options_check
CHECK (tafsir_options IS NULL OR array_length(tafsir_options, 1) IS NULL OR tafsir_options <@ ARRAY['baca_tafsir', 'tulis_ayat', 'audio_tafsir', 'baca_terjemahan', 'baca_terjemahan_perkata']::TEXT[]);

-- Update the constraint for tikrar_bi_al_ghaib_40x to include the new Teman options
ALTER TABLE public.jurnal_records
DROP CONSTRAINT IF EXISTS jurnal_records_tikrar_bi_al_ghaib_40x_check;

ALTER TABLE public.jurnal_records
ADD CONSTRAINT jurnal_records_tikrar_bi_al_ghaib_40x_check
CHECK (
  tikrar_bi_al_ghaib_40x IS NULL OR 
  array_length(tikrar_bi_al_ghaib_40x, 1) IS NULL OR 
  tikrar_bi_al_ghaib_40x <@ ARRAY[
    'pasangan_40', 
    'pasangan_40_wa', 
    'keluarga_40', 
    'keluarga_40_suami', 
    'keluarga_40_ayah', 
    'keluarga_40_ibu', 
    'keluarga_40_kakak', 
    'keluarga_40_adik', 
    'keluarga_40_saudara', 
    'tarteel_40',
    'teman_mti_40',
    'teman_luar_mti_40'
  ]::TEXT[]
);
