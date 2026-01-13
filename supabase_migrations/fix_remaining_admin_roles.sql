-- Fix users with role='admin' but roles is NULL or doesn't contain 'admin'
UPDATE public.users
SET
  roles = ARRAY['admin']::text[],
  updated_at = NOW()
WHERE role = 'admin'
  AND (roles IS NULL OR NOT (roles @> ARRAY['admin']::text[]));

-- Show results to verify
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
