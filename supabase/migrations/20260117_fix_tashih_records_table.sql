-- =====================================================
-- FIX TASHIH RECORDS TABLE
-- =====================================================
-- Add missing fields and fix RLS policies
-- =====================================================

-- Add missing ustadzah_id field
ALTER TABLE public.tashih_records ADD COLUMN IF NOT EXISTS ustadzah_id UUID;

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view own tashih records" ON public.tashih_records;
DROP POLICY IF EXISTS "Users can insert own tashih records" ON public.tashih_records;
DROP POLICY IF EXISTS "Users can update own tashih records" ON public.tashih_records;
DROP POLICY IF EXISTS "Admins can view all tashih records" ON public.tashih_records;

-- Create simple, working policies
CREATE POLICY "Users can view own tashih records"
  ON public.tashih_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tashih records"
  ON public.tashih_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tashih records"
  ON public.tashih_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tashih records"
  ON public.tashih_records FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add index for ustadzah_id
CREATE INDEX IF NOT EXISTS idx_tashih_records_ustadzah_id ON public.tashih_records(ustadzah_id);
