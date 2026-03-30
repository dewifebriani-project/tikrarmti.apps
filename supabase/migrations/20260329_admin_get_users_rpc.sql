-- =====================================================
-- RPC FUNCTION: admin_get_users
-- Bypasses RLS to return all users for admin panel
-- =====================================================

CREATE OR REPLACE FUNCTION public.admin_get_users(
  page_num integer DEFAULT 1,
  page_size integer DEFAULT 50,
  search_text text DEFAULT NULL,
  role_filter text DEFAULT 'all',
  status_filter text DEFAULT 'all',
  sort_by text DEFAULT 'created_at',
  sort_order text DEFAULT 'desc'
)
RETURNS TABLE (
  users jsonb,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  offset_val integer;
  result_users jsonb;
  result_count bigint;
BEGIN
  offset_val := (page_num - 1) * page_size;

  -- Get total count matching filters
  EXECUTE format('
    SELECT count(*)
    FROM public.users
    WHERE 1=1
    %s
    %s
    %s
  ',
    CASE WHEN search_text IS NOT NULL THEN
      'AND (full_name ILIKE ''%'' || $1 || ''%'' OR email ILIKE ''%'' || $1 || ''%'' OR whatsapp ILIKE ''%'' || $1 || ''%'')'
    ELSE '' END,
    CASE WHEN role_filter = 'admin' THEN 'AND ''admin'' = ANY(roles)'
         WHEN role_filter = 'thalibah' THEN 'AND ''thalibah'' = ANY(roles)'
         ELSE '' END,
    CASE WHEN status_filter = 'blacklisted' THEN 'AND is_blacklisted = true'
         WHEN status_filter = 'active' THEN 'AND is_active = true AND is_blacklisted = false'
         WHEN status_filter = 'inactive' THEN 'AND is_active = false'
         ELSE '' END
  ) USING search_text INTO result_count;

  -- Get paginated users
  EXECUTE format('
    SELECT jsonb_agg(jsonb_build_object(
      ''id'', id,
      ''email'', email,
      ''full_name'', full_name,
      ''whatsapp'', whatsapp,
      ''roles'', roles,
      ''role'', role,
      ''is_active'', is_active,
      ''is_blacklisted'', is_blacklisted,
      ''created_at'', created_at,
      ''updated_at'', updated_at
    ))
    FROM (
      SELECT *
      FROM public.users
      WHERE 1=1
      %s
      %s
      %s
      ORDER BY %s %s
      LIMIT %s OFFSET %s
    ) t
  ',
    CASE WHEN search_text IS NOT NULL THEN
      'AND (full_name ILIKE ''%'' || $1 || ''%'' OR email ILIKE ''%'' || $1 || ''%'' OR whatsapp ILIKE ''%'' || $1 || ''%'')'
    ELSE '' END,
    CASE WHEN role_filter = 'admin' THEN 'AND ''admin'' = ANY(roles)'
         WHEN role_filter = 'thalibah' THEN 'AND ''thalibah'' = ANY(roles)'
         ELSE '' END,
    CASE WHEN status_filter = 'blacklisted' THEN 'AND is_blacklisted = true'
         WHEN status_filter = 'active' THEN 'AND is_active = true AND is_blacklisted = false'
         WHEN status_filter = 'inactive' THEN 'AND is_active = false'
         ELSE '' END,
    sort_by, sort_order, page_size, offset_val
  ) USING search_text INTO result_users;

  RETURN QUERY SELECT result_users, result_count;
END;
$$;

-- Grant execute to authenticated (service role will use SECURITY DEFINER)
GRANT EXECUTE ON FUNCTION public.admin_get_users TO authenticated;

-- =====================================================
-- TEST THE FUNCTION
-- =====================================================

-- Test basic call
SELECT * FROM public.admin_get_users(1, 10, NULL, 'all', 'all', 'created_at', 'desc');
