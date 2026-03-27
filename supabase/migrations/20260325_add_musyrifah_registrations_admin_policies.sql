-- ============================================================================
-- Add Admin Policies for musyrifah_registrations
-- ============================================================================
-- Purpose: Add admin management policies for musyrifah_registrations table
-- Created: 2025-03-25
-- ============================================================================

-- Enable RLS on musyrifah_registrations table (should already be enabled)
ALTER TABLE musyrifah_registrations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE OR REPLACE POLICIES (idempotent)
-- ============================================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- 1. Admins can view all musyrifah registrations
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'musyrifah_registrations'
  AND policyname = 'Admins can view all musyrifah registrations';

  IF policy_count = 0 THEN
    CREATE POLICY "Admins can view all musyrifah registrations"
    ON musyrifah_registrations
    FOR SELECT
    TO authenticated
    USING (is_admin_user(auth.uid()));
    RAISE NOTICE 'Created policy: Admins can view all musyrifah registrations';
  END IF;

  -- 2. Admins can manage all musyrifah registrations
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'musyrifah_registrations'
  AND policyname = 'Admins can manage musyrifah registrations';

  IF policy_count = 0 THEN
    CREATE POLICY "Admins can manage musyrifah registrations"
    ON musyrifah_registrations
    FOR ALL
    TO authenticated
    USING (is_admin_user(auth.uid()))
    WITH CHECK (is_admin_user(auth.uid()));
    RAISE NOTICE 'Created policy: Admins can manage musyrifah registrations';
  END IF;

  -- 3. Staff can view all musyrifah registrations
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'musyrifah_registrations'
  AND policyname = 'Staff can view all musyrifah registrations';

  IF policy_count = 0 THEN
    CREATE POLICY "Staff can view all musyrifah registrations"
    ON musyrifah_registrations
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND (
          users.role IN ('musyrifah', 'muallimah', 'admin', 'super_admin')
          OR users.roles && ARRAY['musyrifah', 'muallimah', 'admin', 'super_admin']::text[]
        )
      )
    );
    RAISE NOTICE 'Created policy: Staff can view all musyrifah registrations';
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
AND tablename = 'musyrifah_registrations'
ORDER BY policyname;
