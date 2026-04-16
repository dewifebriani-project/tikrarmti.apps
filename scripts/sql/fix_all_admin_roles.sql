-- =====================================================
-- AUTO-FIX ALL ADMIN ROLES (No manual input needed)
-- =====================================================

-- STEP 1: Fix ALL users where role='admin' but roles array is missing 'admin'
UPDATE public.users
SET
  roles = ARRAY['admin']::text[],
  updated_at = NOW()
WHERE role = 'admin'
  AND NOT (roles @> ARRAY['admin']::text[]);

-- STEP 2: Fix ALL users where roles has 'admin' but role is not 'admin'
UPDATE public.users
SET
  role = 'admin',
  updated_at = NOW()
WHERE (roles @> ARRAY['admin']::text[])
  AND (role IS NULL OR role <> 'admin');

-- STEP 3: Show results - all users with admin role
SELECT
  id,
  email,
  full_name,
  role,
  roles,
  updated_at
FROM public.users
WHERE role = 'admin' OR (roles @> ARRAY['admin']::text[])
ORDER BY updated_at DESC;
