-- ============================================================================
-- Fix muallimah_registrations RLS Policies
-- ============================================================================
-- Purpose: Ensure all muallimah_registrations RLS policies are properly created
-- Created: 2026-01-06
-- ============================================================================

-- Enable RLS on muallimah_registrations table
ALTER TABLE muallimah_registrations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE OR REPLACE POLICIES (idempotent)
-- ============================================================================

-- Note: PostgreSQL doesn't support CREATE OR REPLACE POLICY, so we use DO block

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- 1. Users can view their own muallimah registration
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'muallimah_registrations'
  AND policyname = 'Users can view own muallimah registration';

  IF policy_count = 0 THEN
    CREATE POLICY "Users can view own muallimah registration"
    ON muallimah_registrations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
    RAISE NOTICE 'Created policy: Users can view own muallimah registration';
  END IF;

  -- 2. Users can insert their own muallimah registration
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'muallimah_registrations'
  AND policyname = 'Users can insert own muallimah registration';

  IF policy_count = 0 THEN
    CREATE POLICY "Users can insert own muallimah registration"
    ON muallimah_registrations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
    RAISE NOTICE 'Created policy: Users can insert own muallimah registration';
  END IF;

  -- 3. Users can update their own muallimah registration
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'muallimah_registrations'
  AND policyname = 'Users can update own muallimah registration';

  IF policy_count = 0 THEN
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
    RAISE NOTICE 'Created policy: Users can update own muallimah registration';
  END IF;

  -- 4. Service role can do anything
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'muallimah_registrations'
  AND policyname = 'Service role can manage muallimah registrations';

  IF policy_count = 0 THEN
    CREATE POLICY "Service role can manage muallimah registrations"
    ON muallimah_registrations
    FOR ALL
    TO service_role
    WITH CHECK (true);
    RAISE NOTICE 'Created policy: Service role can manage muallimah registrations';
  END IF;

  -- 5. Admins can view all registrations
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'muallimah_registrations'
  AND policyname = 'Admins can view all muallimah registrations';

  IF policy_count = 0 THEN
    CREATE POLICY "Admins can view all muallimah registrations"
    ON muallimah_registrations
    FOR SELECT
    TO authenticated
    USING (is_admin_user(auth.uid()));
    RAISE NOTICE 'Created policy: Admins can view all muallimah registrations';
  END IF;

  -- 6. Admins can manage all registrations
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'muallimah_registrations'
  AND policyname = 'Admins can manage muallimah registrations';

  IF policy_count = 0 THEN
    CREATE POLICY "Admins can manage muallimah registrations"
    ON muallimah_registrations
    FOR ALL
    TO authenticated
    USING (is_admin_user(auth.uid()))
    WITH CHECK (is_admin_user(auth.uid()));
    RAISE NOTICE 'Created policy: Admins can manage muallimah registrations';
  END IF;

END $$;

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
