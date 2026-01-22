-- =====================================================
-- FIX TASHIH_RECORDS AND JURNAL_RECORDS RLS FOR ROLES ARRAY
-- =====================================================
-- Purpose: Update RLS policies to check both role (single) and roles (array)
--          to support dual-role users (e.g., thalibah + admin)
-- Created: 2026-01-23
-- =====================================================

-- =====================================================
-- 1. FIX TASHIH_RECORDS RLS POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own tashih records" ON public.tashih_records;
DROP POLICY IF EXISTS "Users can insert own tashih records" ON public.tashih_records;
DROP POLICY IF EXISTS "Users can update own tashih records" ON public.tashih_records;
DROP POLICY IF EXISTS "Users can delete own tashih records" ON public.tashih_records;
DROP POLICY IF EXISTS "Admins can view all tashih records" ON public.tashih_records;

-- Create updated policies that check both role and roles array
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
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tashih records"
  ON public.tashih_records FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Updated admin policy that checks both role and roles array
CREATE POLICY "Admins can view all tashih records"
  ON public.tashih_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.role = 'admin' OR 'admin' = ANY(users.roles))
    )
  );

-- =====================================================
-- 2. FIX JURNAL_RECORDS RLS POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Users can insert own jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Users can update own jurnal records" ON public.jurnal_records;
DROP POLICY IF EXISTS "Users can delete own jurnal records" ON public.jurnal_records;

-- Create updated policies for jurnal_records
CREATE POLICY "Users can view own jurnal records"
  ON public.jurnal_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jurnal records"
  ON public.jurnal_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jurnal records"
  ON public.jurnal_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own jurnal records"
  ON public.jurnal_records FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add admin policy for jurnal_records (in case needed)
CREATE POLICY "Admins can view all jurnal records"
  ON public.jurnal_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.role = 'admin' OR 'admin' = ANY(users.roles))
    )
  );

-- =====================================================
-- 3. ENSURE RLS IS ENABLED
-- =====================================================

ALTER TABLE public.tashih_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurnal_records ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. GRANT EXPLICIT PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.tashih_records TO authenticated;
GRANT ALL ON public.jurnal_records TO authenticated;

-- =====================================================
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON POLICY "Users can view own tashih records" ON public.tashih_records IS
  'RLS SELECT policy: Authenticated users can only view their own tashih records';

COMMENT ON POLICY "Users can insert own tashih records" ON public.tashih_records IS
  'RLS INSERT policy: Authenticated users can only insert their own tashih records';

COMMENT ON POLICY "Users can update own tashih records" ON public.tashih_records IS
  'RLS UPDATE policy: Authenticated users can only update their own tashih records';

COMMENT ON POLICY "Users can delete own tashih records" ON public.tashih_records IS
  'RLS DELETE policy: Authenticated users can only delete their own tashih records';

COMMENT ON POLICY "Admins can view all tashih records" ON public.tashih_records IS
  'RLS SELECT policy: Admin users (role=admin or admin in roles array) can view all tashih records';

COMMENT ON POLICY "Users can view own jurnal records" ON public.jurnal_records IS
  'RLS SELECT policy: Authenticated users can only view their own jurnal records';

COMMENT ON POLICY "Users can insert own jurnal records" ON public.jurnal_records IS
  'RLS INSERT policy: Authenticated users can only insert their own jurnal records';

COMMENT ON POLICY "Users can update own jurnal records" ON public.jurnal_records IS
  'RLS UPDATE policy: Authenticated users can only update their own jurnal records';

COMMENT ON POLICY "Users can delete own jurnal records" ON public.jurnal_records IS
  'RLS DELETE policy: Authenticated users can only delete their own jurnal records';

COMMENT ON POLICY "Admins can view all jurnal records" ON public.jurnal_records IS
  'RLS SELECT policy: Admin users (role=admin or admin in roles array) can view all jurnal records';

-- =====================================================
-- 6. VERIFY POLICIES ARE ACTIVE
-- =====================================================

DO $$
DECLARE
  tashih_policy_count INTEGER;
  jurnal_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tashih_policy_count
  FROM pg_policies
  WHERE tablename = 'tashih_records';

  SELECT COUNT(*) INTO jurnal_policy_count
  FROM pg_policies
  WHERE tablename = 'jurnal_records';

  RAISE NOTICE 'Total policies on tashih_records: %', tashih_policy_count;
  RAISE NOTICE 'Total policies on jurnal_records: %', jurnal_policy_count;
END $$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================

-- Verification queries (run these after migration to verify):

-- Check RLS policies for tashih_records
/*
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tashih_records'
ORDER BY policyname;
*/

-- Check RLS policies for jurnal_records
/*
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'jurnal_records'
ORDER BY policyname;
*/
