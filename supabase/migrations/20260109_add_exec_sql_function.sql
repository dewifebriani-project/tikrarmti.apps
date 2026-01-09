-- Helper function to execute arbitrary SQL (admin only)
-- This function allows executing SQL strings via RPC
-- WARNING: This function should only be used by admins and should be removed after migrations are applied

CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result TEXT;
BEGIN
  -- Execute the SQL query
  EXECUTE sql_query;
  RETURN 'SQL executed successfully';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
END;
$$;

-- Revoke execute permissions from non-admin users
REVOKE EXECUTE ON FUNCTION exec_sql FROM public;
GRANT EXECUTE ON FUNCTION exec_sql TO service_role;

COMMENT ON FUNCTION exec_sql IS 'Execute arbitrary SQL statements (admin only via service_role)';
