-- =====================================================
-- FIX JURNAL RECORDS CONSTRAINTS - COMPREHENSIVE UPDATE
-- =====================================================

DO $$
BEGIN
    -- 1. Drop existing check constraints related to tikrar bi al ghaib
    ALTER TABLE public.jurnal_records DROP CONSTRAINT IF EXISTS jurnal_records_tikrar_bi_al_ghaib_type_check;
    ALTER TABLE public.jurnal_records DROP CONSTRAINT IF EXISTS jurnal_records_tikrar_bi_al_ghaib_40x_check;
    ALTER TABLE public.jurnal_records DROP CONSTRAINT IF EXISTS jurnal_records_tikrar_bi_al_ghaib_20x_check;

    -- 2. Add COMPREHENSIVE check constraint for tikrar_bi_al_ghaib_type
    ALTER TABLE public.jurnal_records ADD CONSTRAINT jurnal_records_tikrar_bi_al_ghaib_type_check 
    CHECK (
        tikrar_bi_al_ghaib_type IS NULL OR 
        tikrar_bi_al_ghaib_type = '' OR 
        (tikrar_bi_al_ghaib_type = ANY (ARRAY[
            'pasangan_40', 
            'pasangan_40_wa', 
            'keluarga_40', 
            'keluarga_40_suami', 
            'keluarga_40_ayah', 
            'keluarga_40_ibu', 
            'keluarga_40_kakak', 
            'keluarga_40_adik', 
            'keluarga_40_anak', 
            'keluarga_40_teman',
            'keluarga_40_saudara',
            'tarteel_40',
            'pasangan_20',
            'pasangan_20_wa',
            'voice_note_20'
        ]::text[]))
    );

    -- 3. Add COMPREHENSIVE check constraint for tikrar_bi_al_ghaib_40x (ARRAY)
    ALTER TABLE public.jurnal_records ADD CONSTRAINT jurnal_records_tikrar_bi_al_ghaib_40x_check
    CHECK (
        tikrar_bi_al_ghaib_40x IS NULL OR 
        array_length(tikrar_bi_al_ghaib_40x, 1) = 0 OR
        (tikrar_bi_al_ghaib_40x <@ ARRAY[
            'pasangan_40', 
            'pasangan_40_wa', 
            'keluarga_40', 
            'keluarga_40_suami', 
            'keluarga_40_ayah', 
            'keluarga_40_ibu', 
            'keluarga_40_kakak', 
            'keluarga_40_adik', 
            'keluarga_40_anak', 
            'keluarga_40_teman',
            'keluarga_40_saudara',
            'tarteel_40'
        ]::text[])
    );

    -- 4. Add COMPREHENSIVE check constraint for tikrar_bi_al_ghaib_20x (ARRAY)
    ALTER TABLE public.jurnal_records ADD CONSTRAINT jurnal_records_tikrar_bi_al_ghaib_20x_check
    CHECK (
        tikrar_bi_al_ghaib_20x IS NULL OR 
        array_length(tikrar_bi_al_ghaib_20x, 1) = 0 OR
        (tikrar_bi_al_ghaib_20x <@ ARRAY[
            'pasangan_20', 
            'pasangan_20_wa', 
            'voice_note_20'
        ]::text[])
    );
END $$;
