-- ============================================================================
-- FORCE FIX: Replace ALL muallimah_registrations RLS Policies
-- ============================================================================
-- Purpose: Remove duplicate and circular reference policies
-- Created: 2026-01-06
-- ============================================================================

-- Step 1: Remove ALL existing policies (force drop)
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'muallimah_registrations'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON muallimah_registrations', policy_record.policyname);
    RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
  END LOOP;
END $$;

-- Step 2: Create new NON-CIRCULAR policies

-- 1. Users can view their own muallimah registration
CREATE POLICY "Users can view own muallimah registration"
ON muallimah_registrations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Users can insert their own muallimah registration
CREATE POLICY "Users can insert own muallimah registration"
ON muallimah_registrations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own muallimah registration (with status restrictions)
CREATE POLICY "Users can update own muallimah registration"
ON muallimah_registrations
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND status IN ('pending', 'review', 'approved', 'rejected')
)
WITH CHECK (
  auth.uid() = user_id
  AND status IN ('pending', 'review', 'approved', 'rejected')
);

-- 4. Service role can do anything
CREATE POLICY "Service role can manage muallimah registrations"
ON muallimah_registrations
FOR ALL
TO service_role
WITH CHECK (true);

-- 5. Admins can view all registrations (using helper function)
CREATE POLICY "Admins can view all muallimah registrations"
ON muallimah_registrations
FOR SELECT
TO authenticated
USING (is_admin_user(auth.uid()));

-- 6. Admins can manage all registrations
CREATE POLICY "Admins can manage muallimah registrations"
ON muallimah_registrations
FOR ALL
TO authenticated
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

-- Step 3: Verify policies were created
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'muallimah_registrations';

  RAISE NOTICE 'Total policies on muallimah_registrations table: %', policy_count;

  IF policy_count = 0 THEN
    RAISE EXCEPTION 'No policies found on muallimah_registrations table! RLS will block all access.';
  END IF;
END $$;

-- Step 4: Show all policies for verification
SELECT
  policyname,
  permissive,
  cmd,
  substr(qual, 1, 100) as using_clause
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'muallimah_registrations'
ORDER BY policyname;

-- ============================================================================
-- IMPORTANT: After running this migration, test muallimah registration immediately
-- ============================================================================
-- Expected behavior:
-- 1. User can submit muallimah registration (INSERT with auth.uid() = user_id)
-- 2. User can view their own registration
-- 3. User can update their registration (if status allows)
-- 4. Admin can view all registrations
-- 5. Admin can manage all registrations
-- ============================================================================
