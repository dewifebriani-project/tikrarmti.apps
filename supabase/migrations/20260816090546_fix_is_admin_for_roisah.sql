
-- ============================================================================
-- SYSTEMIC FIX: Include 'roisah' in Administrative Role Access
-- ============================================================================
-- Resolution for Roisah not seeing complete lists in RLS-protected queries.
-- This allows roisah to act as admin for RLS purposes.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(
      (
        'admin' = ANY (
          COALESCE((current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'roles')::jsonb, '[]'::jsonb)
        )
        OR
        'super_admin' = ANY (
          COALESCE((current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'roles')::jsonb, '[]'::jsonb)
        )
        OR
        'roisah' = ANY (
          COALESCE((current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'roles')::jsonb, '[]'::jsonb)
        )
      ),
      false
    )
    OR
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE id = auth.uid()
      AND (
        'admin' = ANY(roles) 
        OR 'super_admin' = ANY(roles)
        OR 'roisah' = ANY(roles)
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

