-- ============================================================================
-- Quick check: Does auth.users ID match public.users ID?
-- ============================================================================

-- Get IDs from both tables
SELECT
  'auth.users' as table_name, id, email
FROM auth.users
WHERE email = 'dewifebriani@tazkia.ac.id'

UNION ALL

SELECT
  'public.users' as table_name, id, email
FROM public.users
WHERE email = 'dewifebriani@tazkia.ac.id';

-- Expected result:
-- auth.users    | <some-uuid> | dewifebriani@tazkia.ac.id
-- public.users  | <some-uuid> | dewifebriani@tazkia.ac.id
--
-- If the IDs are DIFFERENT, that's the problem!
-- The RLS policy compares user_id (from public.users) with auth.uid() (from auth.users)
-- If they don't match, RLS will block access.
