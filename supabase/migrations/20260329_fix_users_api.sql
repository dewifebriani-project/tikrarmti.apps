-- =====================================================
-- FIX: Admin Users API - Final Working Version
-- =====================================================

-- Drop old functions
DROP FUNCTION IF EXISTS public.admin_get_users CASCADE;
DROP FUNCTION IF EXISTS public.admin_list_users CASCADE;

-- Create new function with simple name
CREATE OR REPLACE FUNCTION public.get_all_users(
  p_page_num integer DEFAULT 1,
  p_page_size integer DEFAULT 50,
  p_search text DEFAULT NULL,
  p_role text DEFAULT 'all',
  p_status text DEFAULT 'all'
)
RETURNS SETOF public.users
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.users
  WHERE
    (p_search IS NULL OR
     full_name ILIKE '%' || p_search || '%' OR
     email ILIKE '%' || p_search || '%' OR
     whatsapp ILIKE '%' || p_search || '%')
    AND
    (p_role = 'all' OR
     (p_role = 'admin' AND 'admin' = ANY(roles)) OR
     (p_role = 'thalibah' AND 'thalibah' = ANY(roles)))
    AND
    (p_status = 'all' OR
     (p_status = 'blacklisted' AND is_blacklisted = true) OR
     (p_status = 'active' AND is_active = true AND is_blacklisted = false) OR
     (p_status = 'inactive' AND is_active = false))
  ORDER BY created_at DESC
  LIMIT p_page_size OFFSET ((p_page_num - 1) * p_page_size);
$$;

GRANT EXECUTE ON FUNCTION public.get_all_users TO authenticated;

-- Verify
SELECT routine_name, pg_get_function_arguments(oid)
FROM pg_proc
WHERE proname = 'get_all_users' AND pronamespace = 'public';

-- Test
SELECT * FROM public.get_all_users(1, 10, NULL, 'all', 'all');
