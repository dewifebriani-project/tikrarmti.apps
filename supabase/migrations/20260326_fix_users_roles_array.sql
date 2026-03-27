-- ============================================================================
-- FIX USERS ROLES ARRAY - MIGRATION SCRIPT
-- ============================================================================
-- This migration ensures all users have the roles array populated
-- based on their role field for backward compatibility

-- Migrate all users who have role but empty/null roles
UPDATE public.users
SET roles = CASE
  WHEN role IS NULL OR role = '' THEN ARRAY[]::text[]
  ELSE ARRAY[role]::text[]
END
WHERE roles IS NULL OR roles = ARRAY[]::text[];

-- Log the migration results
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count
  FROM public.users
  WHERE roles IS NOT NULL AND roles != ARRAY[]::text[];

  RAISE NOTICE 'Migration completed: % users now have roles array populated', migrated_count;
END $$;

-- Verify the migration
SELECT
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE roles IS NOT NULL AND roles != ARRAY[]::text[]) as users_with_roles,
  COUNT(*) FILTER (WHERE roles IS NULL OR roles = ARRAY[]::text[]) as users_without_roles
FROM public.users;
