-- =====================================================
-- FIX JURNAL_RECORDS RLS - Ensure proper INSERT policy
-- =====================================================

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Users can view own jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Users can insert own jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Users can update own jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Users can delete own jurnal records" ON public.jurnal_records;

-- Create policies with explicit checks

-- SELECT policy - for reading data
CREATE POLICY "Users can view own jurnal records"
  ON public.jurnal_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT policy - for inserting data (WITH CHECK validates new rows)
CREATE POLICY "Users can insert own jurnal records"
  ON public.jurnal_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE policy - for updating data (both USING and WITH CHECK)
CREATE POLICY "Users can update own jurnal records"
  ON public.jurnal_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE policy - for deleting data
CREATE POLICY "Users can delete own jurnal records"
  ON public.jurnal_records FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable RLS
ALTER TABLE public.jurnal_records ENABLE ROW LEVEL SECURITY;

-- Verify policy is created correctly
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'jurnal_records';

  RAISE NOTICE 'Total policies on jurnal_records: %', policy_count;
END $$;

-- Grant explicit permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.jurnal_records TO authenticated;
