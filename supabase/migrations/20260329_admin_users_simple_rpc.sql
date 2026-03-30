-- =====================================================
-- RPC FUNCTION: admin_list_users (SIMPLER VERSION)
-- Returns SETOF records instead of TABLE with jsonb
-- =====================================================

DROP FUNCTION IF EXISTS public.admin_list_users CASCADE;

CREATE OR REPLACE FUNCTION public.admin_list_users(
  page_num integer DEFAULT 1,
  page_size integer DEFAULT 50,
  search_text text DEFAULT NULL,
  role_filter text DEFAULT 'all',
  status_filter text DEFAULT 'all',
  sort_by text DEFAULT 'created_at',
  sort_order text DEFAULT 'desc'
)
RETURNS SETOF public.users
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.users
  WHERE
    -- Search filter
    (search_text IS NULL OR
     full_name ILIKE '%' || search_text || '%' OR
     email ILIKE '%' || search_text || '%' OR
     whatsapp ILIKE '%' || search_text || '%')
    AND
    -- Role filter
    (role_filter = 'all' OR
     (role_filter = 'admin' AND 'admin' = ANY(roles)) OR
     (role_filter = 'thalibah' AND 'thalibah' = ANY(roles)))
    AND
    -- Status filter
    (status_filter = 'all' OR
     (status_filter = 'blacklisted' AND is_blacklisted = true) OR
     (status_filter = 'active' AND is_active = true AND is_blacklisted = false) OR
     (status_filter = 'inactive' AND is_active = false))
  ORDER BY
    CASE WHEN sort_by = 'created_at' THEN created_at ELSE NULL END,
    CASE WHEN sort_by = 'full_name' THEN full_name ELSE NULL END,
    CASE WHEN sort_by = 'email' THEN email ELSE NULL END
  LIMIT page_size OFFSET ((page_num - 1) * page_size);
$$;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.admin_list_users TO authenticated;

-- =====================================================
-- TEST
-- =====================================================

SELECT * FROM public.admin_list_users(1, 10, NULL, 'all', 'all', 'created_at', 'desc');

-- Get total count separately
SELECT count(*) FROM admin_list_users(1, 10000, NULL, 'all', 'all', 'created_at', 'desc');
