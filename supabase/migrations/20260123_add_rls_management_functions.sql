-- =====================================================
-- ADD RLS MANAGEMENT FUNCTIONS FOR ADMIN PANEL
-- =====================================================
-- Purpose: Create helper functions to manage RLS policies
--          from the admin panel
-- Created: 2026-01-23
-- =====================================================

-- =====================================================
-- 1. FUNCTION TO GET ALL RLS POLICIES
-- =====================================================

CREATE OR REPLACE FUNCTION admin_get_rls_policies()
RETURNS TABLE (
  schemaname text,
  tablename text,
  policyname text,
  permissive text,
  roles text[],
  cmd text,
  qual text,
  with_check text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    p.schemaname,
    p.tablename,
    p.policyname,
    p.permissive::text,
    p.roles,
    p.cmd,
    p.qual,
    p.with_check
  FROM pg_policies p
  WHERE p.schemaname = 'public'
  ORDER BY p.tablename, p.policyname;
$$;

-- =====================================================
-- 2. FUNCTION TO CHECK TABLE RLS STATUS
-- =====================================================

CREATE OR REPLACE FUNCTION check_table_rls(table_name text)
RETURNS TABLE (
  has_rls boolean,
  policy_count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    c.relrowsecurity as has_rls,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = table_name AND schemaname = 'public') as policy_count
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE c.relname = table_name
  AND n.nspname = 'public';
$$;

-- =====================================================
-- 3. FUNCTION TO EXECUTE SQL (ADMIN ONLY)
-- =====================================================

CREATE OR REPLACE FUNCTION admin_exec_sql(sql_query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Only allow admin role to execute
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND (users.role = 'admin' OR 'admin' = ANY(users.roles))
  ) THEN
    RAISE EXCEPTION 'Permission denied: Admin role required';
  END IF;

  -- Execute the SQL dynamically
  EXECUTE sql_query;

  -- Return success
  result := jsonb_build_object(
    'success', true,
    'message', 'SQL executed successfully'
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- =====================================================
-- 4. GRANT PERMISSIONS
-- =====================================================

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION admin_get_rls_policies() TO authenticated;
GRANT EXECUTE ON FUNCTION check_table_rls(text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_exec_sql(text) TO authenticated;

-- =====================================================
-- 5. CREATE VIEW FOR EASIER POLICY ACCESS
-- =====================================================

CREATE OR REPLACE VIEW pg_policies_view AS
SELECT
  p.schemaname,
  p.tablename,
  p.policyname,
  p.permissive::text,
  p.roles,
  p.cmd,
  p.qual,
  p.with_check
FROM pg_policies p
WHERE p.schemaname = 'public';

GRANT SELECT ON pg_policies_view TO authenticated;

-- =====================================================
-- END OF MIGRATION
-- =====================================================

-- Verification query:
/*
-- Test getting RLS policies
SELECT * FROM admin_get_rls_policies();

-- Test checking table RLS status
SELECT * FROM check_table_rls('tashih_records');
SELECT * FROM check_table_rls('jurnal_records');

-- Test view
SELECT * FROM pg_policies_view;
*/
