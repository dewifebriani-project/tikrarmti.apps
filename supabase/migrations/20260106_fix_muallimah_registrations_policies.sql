-- ============================================================================
-- Fix muallimah_registrations RLS Policies
-- ============================================================================
-- Purpose: Ensure all muallimah_registrations RLS policies are properly created
-- Created: 2026-01-06
-- ============================================================================

-- Enable RLS on muallimah_registrations table
ALTER TABLE muallimah_registrations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own muallimah registration" ON muallimah_registrations;
DROP POLICY IF EXISTS "Users can insert own muallimah registration" ON muallimah_registrations;
DROP POLICY IF EXISTS "Users can update own muallimah registration" ON muallimah_registrations;
DROP POLICY IF EXISTS "Service role can manage muallimah registrations" ON muallimah_registrations;

DROP POLICY IF EXISTS "allow_users_read_own_registrations" ON muallimah_registrations;
DROP POLICY IF EXISTS "allow_users_insert_own_registrations" ON muallimah_registrations;
DROP POLICY IF EXISTS "allow_users_update_own_pending_registrations" ON muallimah_registrations;

-- ============================================================================
-- CREATE POLICIES
-- ============================================================================

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

-- 3. Users can update their own muallimah registration (only if pending/review)
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

-- 4. Service role (admin) can do anything
CREATE POLICY "Service role can manage muallimah registrations"
ON muallimah_registrations
FOR ALL
TO service_role
WITH CHECK (true);

-- 5. Admins can view all registrations
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

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT
  policyname,
  cmd,
  CASE
    WHEN qual IS NOT NULL THEN substr(qual, 1, 100)
    WHEN with_check IS NOT NULL THEN substr(with_check, 1, 100)
    ELSE 'No restriction'
  END as policy_definition
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'muallimah_registrations'
ORDER BY policyname;

-- ============================================================================
-- EXPECTED POLICIES:
-- 1. Users can view own muallimah registration - SELECT
-- 2. Users can insert own muallimah registration - INSERT
-- 3. Users can update own muallimah registration - UPDATE
-- 4. Service role can manage muallimah registrations - ALL
-- 5. Admins can view all muallimah registrations - SELECT
-- 6. Admins can manage muallimah registrations - ALL
-- ============================================================================
