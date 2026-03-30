-- EMERGENCY FIX FOR JURNAL RECORDS CONSTRAINTS
-- This script drops and recreates the strict check constraints to allow new family members

BEGIN;

-- 1. Drop the constraints by name (based on user's error message)
ALTER TABLE public.jurnal_records DROP CONSTRAINT IF EXISTS jurnal_records_tikrar_bi_al_ghaib_40x_check;
ALTER TABLE public.jurnal_records DROP CONSTRAINT IF EXISTS jurnal_records_tikrar_bi_al_ghaib_type_check;

-- 2. Add them back with the NEW values: keluarga_40_anak, keluarga_40_teman
ALTER TABLE public.jurnal_records ADD CONSTRAINT jurnal_records_tikrar_bi_al_ghaib_type_check 
CHECK (
    tikrar_bi_al_ghaib_type IS NULL OR 
    tikrar_bi_al_ghaib_type = '' OR 
    tikrar_bi_al_ghaib_type IN (
        'pasangan_40', 'pasangan_40_wa', 'keluarga_40', 
        'keluarga_40_suami', 'keluarga_40_ayah', 'keluarga_40_ibu', 
        'keluarga_40_kakak', 'keluarga_40_adik', 'keluarga_40_saudara',
        'keluarga_40_anak', 'keluarga_40_teman', 'tarteel_40',
        'pasangan_20', 'pasangan_20_wa', 'voice_note_20'
    )
);

ALTER TABLE public.jurnal_records ADD CONSTRAINT jurnal_records_tikrar_bi_al_ghaib_40x_check
CHECK (
    tikrar_bi_al_ghaib_40x IS NULL OR 
    array_length(tikrar_bi_al_ghaib_40x, 1) = 0 OR
    tikrar_bi_al_ghaib_40x <@ ARRAY[
        'pasangan_40', 'pasangan_40_wa', 'keluarga_40', 
        'keluarga_40_suami', 'keluarga_40_ayah', 'keluarga_40_ibu', 
        'keluarga_40_kakak', 'keluarga_40_adik', 'keluarga_40_saudara',
        'keluarga_40_anak', 'keluarga_40_teman', 'tarteel_40'
    ]::TEXT[]
);

COMMIT;
