-- ==========================================
-- SYSTEMIC FIX: Roles Sync to Auth Metadata
-- ==========================================
-- Automatic synchronization between 'public.users' and 'auth.users'.
-- This ensures that roles appear in the JWT and solve RLS recursion.

-- 1. Function to synchronize roles to auth.users.raw_app_metadata
CREATE OR REPLACE FUNCTION public.sync_user_roles_to_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as Postgres to bypass RLS in auth schema
SET search_path = public, auth
AS $$
BEGIN
  -- We merge the existing app_metadata with the new roles and role
  -- Using COALESCE to ensure no null values if metadata is empty
  UPDATE auth.users
  SET raw_app_metadata = 
    COALESCE(raw_app_metadata, '{}'::jsonb) || 
    jsonb_strip_nulls(jsonb_build_object(
      'roles', NEW.roles, 
      'role', NEW.role
    ))
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- 2. Attach trigger to handle future changes
DROP TRIGGER IF EXISTS on_user_roles_updated ON public.users;
CREATE TRIGGER on_user_roles_updated
  AFTER INSERT OR UPDATE OF roles, role ON public.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.sync_user_roles_to_auth();

-- 3. INITIAL SYNC: Run once for ALL current users (including 10 admins)
-- This logic ensures that any currently logged in admins get their claims
-- refreshed upon their next session initialization (or manual logout/login).
DO $$
DECLARE
  user_row RECORD;
BEGIN
  FOR user_row IN SELECT * FROM public.users LOOP
    UPDATE auth.users
    SET raw_app_metadata = 
      COALESCE(raw_app_metadata, '{}'::jsonb) || 
      jsonb_strip_nulls(jsonb_build_object(
        'roles', user_row.roles, 
        'role', user_row.role
      ))
    WHERE id = user_row.id;
  END LOOP;
END;
$$;

-- 4. OPTIMIZED RLS POLICY (Final Version)
-- Now that roles are in the JWT, we can avoid ANY subqueries to the users table
DROP POLICY IF EXISTS "Admins can view profiles" ON users;
CREATE POLICY "Admins can view profiles" 
ON users FOR SELECT 
TO authenticated 
USING (
  (auth.uid() = id) OR 
  (auth.jwt() -> 'app_metadata' -> 'roles' @> '["admin"]')
);

DROP POLICY IF EXISTS "Users can manage profiles" ON users;
CREATE POLICY "Users can manage profiles" 
ON users FOR ALL 
TO authenticated 
USING (
  (auth.uid() = id) OR 
  (auth.jwt() -> 'app_metadata' -> 'roles' @> '["admin"]')
)
WITH CHECK (
  (auth.uid() = id) OR 
  (auth.jwt() -> 'app_metadata' -> 'roles' @> '["admin"]')
);
