-- =====================================================
-- DEBUG: Super simple RPC to test if ANY data returns
-- =====================================================

-- Drop existing
DROP FUNCTION IF EXISTS public.debug_get_users CASCADE;

-- Create ultra-simple function
CREATE OR REPLACE FUNCTION public.debug_get_users()
RETURNS SETOF jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', id,
    'email', email,
    'full_name', full_name
  )
  FROM public.users
  LIMIT 10;
$$;

GRANT EXECUTE ON FUNCTION public.debug_get_users TO authenticated;

-- Test immediately
SELECT * FROM public.debug_get_users();
