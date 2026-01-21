-- =====================================================
-- FIX JURNAL RECORDS - RLS POLICY AND CONSTRAINTS
-- =====================================================
-- 1. Drop outdated CHECK constraint on tikrar_bi_al_ghaib_type
-- 2. Recreate RLS policies with proper security
-- 3. Ensure user_id is properly validated
-- =====================================================

-- First, drop the outdated constraint that blocks valid values
ALTER TABLE public.jurnal_records
  DROP CONSTRAINT IF EXISTS jurnal_records_tikrar_bi_al_ghaib_type_check;

-- The field tikrar_bi_al_ghaib_type should allow values from both 40x and 20x options
-- Valid values now include: pasangan_40, keluarga_40, tarteel_40, pasangan_20_wa, voice_note_20, etc.
ALTER TABLE public.jurnal_records
  ADD CONSTRAINT jurnal_records_tikrar_bi_al_ghaib_type_check
    CHECK (tikrar_bi_al_ghaib_type IS NULL OR
           tikrar_bi_al_ghaib_type = '' OR
           tikrar_bi_al_ghaib_type IN (
             -- Main 40x options
             'pasangan_40', 'keluarga_40', 'tarteel_40',
             -- Pasangan 40x sub-options
             'pasangan_40_wa',
             -- Pasangan 20x options
             'pasangan_20_wa', 'voice_note_20', 'pasangan_20',
             -- Keluarga 40x options
             'keluarga_40_suami', 'keluarga_40_ayah', 'keluarga_40_ibu',
             'keluarga_40_kakak', 'keluarga_40_adik', 'keluarga_40_saudara'
           ));

-- =====================================================
-- FIX 40X ARRAY CONSTRAINT - Allow all valid 40x options
-- =====================================================

-- Drop the old 40x constraint that's too restrictive
ALTER TABLE public.jurnal_records
  DROP CONSTRAINT IF EXISTS jurnal_records_tikrar_bi_al_ghaib_40x_check;

-- Recreate with all valid 40x values (including WA and keluarga variants)
ALTER TABLE public.jurnal_records
  ADD CONSTRAINT jurnal_records_tikrar_bi_al_ghaib_40x_check
    CHECK (tikrar_bi_al_ghaib_40x IS NULL OR
           array_length(tikrar_bi_al_ghaib_40x, 1) IS NULL OR
           tikrar_bi_al_ghaib_40x <@ ARRAY[
             'pasangan_40', 'pasangan_40_wa',
             'keluarga_40', 'keluarga_40_suami', 'keluarga_40_ayah', 'keluarga_40_ibu',
             'keluarga_40_kakak', 'keluarga_40_adik', 'keluarga_40_saudara',
             'tarteel_40'
           ]::TEXT[]);

-- =====================================================
-- FIX 20X ARRAY CONSTRAINT - Allow all valid 20x options
-- =====================================================

-- Drop the old 20x constraint that's too restrictive
ALTER TABLE public.jurnal_records
  DROP CONSTRAINT IF EXISTS jurnal_records_tikrar_bi_al_ghaib_20x_check;

-- Recreate with all valid 20x values (including WA variants)
ALTER TABLE public.jurnal_records
  ADD CONSTRAINT jurnal_records_tikrar_bi_al_ghaib_20x_check
    CHECK (tikrar_bi_al_ghaib_20x IS NULL OR
           array_length(tikrar_bi_al_ghaib_20x, 1) IS NULL OR
           tikrar_bi_al_ghaib_20x <@ ARRAY[
             'pasangan_20', 'pasangan_20_wa', 'voice_note_20'
           ]::TEXT[]);

-- =====================================================
-- RECREATE RLS POLICIES - Ensure proper security
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Users can insert own jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Users can update own jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Users can delete own jurnal records" ON public.jurnal_records;

-- Create INSERT policy with WITH CHECK (validates the data being inserted)
-- This is the policy that gets triggered on INSERT
CREATE POLICY "Users can insert own jurnal records"
  ON public.jurnal_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create SELECT policy
CREATE POLICY "Users can view own jurnal records"
  ON public.jurnal_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create UPDATE policy
CREATE POLICY "Users can update own jurnal records"
  ON public.jurnal_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create DELETE policy
CREATE POLICY "Users can delete own jurnal records"
  ON public.jurnal_records FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- VERIFY POLICIES ARE ACTIVE
-- =====================================================

-- Ensure RLS is enabled
ALTER TABLE public.jurnal_records ENABLE ROW LEVEL SECURITY;

-- Add comment for documentation
COMMENT ON POLICY "Users can insert own jurnal records" ON public.jurnal_records IS
  'RLS INSERT policy: Authenticated users can only insert records where user_id matches their own auth.uid()';
