-- ============================================================================
-- DISABLE RLS FOR ALL TABLES - Complete fix
-- ============================================================================

-- Disable RLS for all tables that still have it enabled
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND rowsecurity = true
    LOOP
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', table_name);
        RAISE NOTICE 'Disabled RLS for table: %', table_name;
    END LOOP;
END $$;

-- Verification - Should return no rows if all RLS are disabled
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;
