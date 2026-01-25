-- =====================================================
-- EMERGENCY FIX: ENABLE THALIBAH TO INSERT TASHIH/JURNAL RECORDS
-- =====================================================
-- Copy and paste this entire script into Supabase SQL Editor
-- Then click "Run" to execute
-- =====================================================

-- Step 1: Drop all existing policies first
DROP POLICY IF EXISTS "Users can view own tashih records" ON public.tashih_records;
DROP POLICY IF EXISTS "Users can insert own tashih records" ON public.tashih_records;
DROP POLICY IF EXISTS "Users can update own tashih records" ON public.tashih_records;
DROP POLICY IF EXISTS "Users can delete own tashih records" ON public.tashih_records;
DROP POLICY IF EXISTS "Admins can view all tashih records" ON public.tashih_records;
DROP POLICY IF EXISTS "Admins and Musyrifah can view all tashih records" ON public.tashih_records;
DROP POLICY IF EXISTS "Authenticated users can manage own tashih records" ON public.tashih_records;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.tashih_records;

DROP POLICY IF EXISTS "Users can view own jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Users can insert own jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Users can update own jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Users can delete own jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Admins can view all jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Admins and Musyrifah can view all jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Authenticated users can manage own jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.jurnal_records;

-- Step 2: Enable RLS on both tables
ALTER TABLE public.tashih_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurnal_records ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policies for tashih_records

-- Users can view their own records
CREATE POLICY "Users can view own tashih records"
  ON public.tashih_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own records
CREATE POLICY "Users can insert own tashih records"
  ON public.tashih_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own records
CREATE POLICY "Users can update own tashih records"
  ON public.tashih_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own records
CREATE POLICY "Users can delete own tashih records"
  ON public.tashih_records FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins and Musyrifah can view all records
CREATE POLICY "Admins and Musyrifah can view all tashih records"
  ON public.tashih_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (
        users.role = 'admin'
        OR users.role = 'musyrifah'
        OR 'admin' = ANY(users.roles)
        OR 'musyrifah' = ANY(users.roles)
      )
    )
  );

-- Step 4: Create policies for jurnal_records

-- Users can view their own records
CREATE POLICY "Users can view own jurnal records"
  ON public.jurnal_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own records
CREATE POLICY "Users can insert own jurnal records"
  ON public.jurnal_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own records
CREATE POLICY "Users can update own jurnal records"
  ON public.jurnal_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own records
CREATE POLICY "Users can delete own jurnal records"
  ON public.jurnal_records FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins and Musyrifah can view all records
CREATE POLICY "Admins and Musyrifah can view all jurnal records"
  ON public.jurnal_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (
        users.role = 'admin'
        OR users.role = 'musyrifah'
        OR 'admin' = ANY(users.roles)
        OR 'musyrifah' = ANY(users.roles)
      )
    )
  );

-- Step 5: Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tashih_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jurnal_records TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 6: Verify policies are created
SELECT
  'tashih_records' as table_name,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'tashih_records'
UNION ALL
SELECT
  'jurnal_records' as table_name,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'jurnal_records';

-- =====================================================
-- VERIFICATION QUERIES (run these after to verify)
-- =====================================================

-- Check all policies for tashih_records
/*
SELECT
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'tashih_records'
ORDER BY policyname;
*/

-- Check all policies for jurnal_records
/*
SELECT
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'jurnal_records'
ORDER BY policyname;
*/

-- Test as a thalibah user (replace with actual user_id)
/*
-- This should work after fix:
INSERT INTO public.tashih_records (user_id, blok, lokasi, masalah_tajwid, waktu_tashih)
VALUES ('<user_id>', 'H1A', 'mti', ARRAY['makhroj'], NOW());
*/
