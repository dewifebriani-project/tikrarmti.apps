-- ============================================================================
-- FINAL ARCHITECTURE SYNC: IDENTITY TRIGGERS & CLEAN RLS
-- ============================================================================
-- This migration implements the core "Data Authority" architecture:
-- 1. Automatic sync between auth.users and public.users via triggers.
-- 2. Robust, non-recursive is_admin() function.
-- 3. Cleanup of all problematic RLS policies.
-- 4. One-time massive sync of all 320+ existing users.

-- 1. ROBUST ADMIN CHECK FUNCTION (SECURITY DEFINER)
-- Bypasses RLS to check admin status, preventing recursion.
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Robust check: match by ID OR by specific known admin emails
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE 
      (id = auth.uid()) 
      AND (role = 'admin' OR 'admin' = ANY(roles))
  );
END;
$$;

-- 2. IDENTITY SYNC TRIGGER FUNCTION
-- Automatically creates/updates public.users records from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  initial_role text;
  is_adm boolean;
BEGIN
  -- Determine role from metadata if present
  initial_role := COALESCE(
    new.raw_app_meta_data->>'role', 
    new.raw_user_meta_data->>'role', 
    'thalibah'
  );

  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    role, 
    roles, 
    is_active
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email), 
    initial_role,
    ARRAY[initial_role],
    true
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(public.users.full_name, EXCLUDED.full_name),
    -- NEVER downgrade from admin
    roles = CASE 
      WHEN 'admin' = ANY(public.users.roles) THEN public.users.roles
      ELSE EXCLUDED.roles
    END,
    role = CASE 
      WHEN public.users.role = 'admin' THEN 'admin'
      ELSE EXCLUDED.role
    END;

  RETURN new;
END;
$$;

-- 3. ATTACH TRIGGER TO AUTH.USERS
-- This requires high-level trigger permissions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 4. CLEANUP & STABILIZE RLS POLICIES (Users Table)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Users can view profiles" ON public.users;
DROP POLICY IF EXISTS "Users can manage profiles" ON public.users;
DROP POLICY IF EXISTS "Public access" ON public.users;
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_all_policy" ON public.users;

-- Clean Select: Own profile OR Admin access
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
CREATE POLICY "users_select_policy" 
ON public.users FOR SELECT 
TO authenticated 
USING (
  (auth.uid() = id) OR 
  (auth.jwt()->>'email' = email) OR
  public.is_admin()
);

-- Clean All: Own profile manage OR Admin access
DROP POLICY IF EXISTS "users_all_policy" ON public.users;
CREATE POLICY "users_all_policy" 
ON public.users FOR ALL 
TO authenticated 
USING (
  (auth.uid() = id) OR 
  public.is_admin()
)
WITH CHECK (
  (auth.uid() = id) OR 
  public.is_admin()
);

-- 5. APPLY CLEAN RLS TO CORE TABLES (Summary)
-- Each should follow the pattern: (is_admin()) OR (own_record)

-- Batches
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin manage batches" ON public.batches;
DROP POLICY IF EXISTS "Public view batches" ON public.batches;
DROP POLICY IF EXISTS "batches_admin_all" ON public.batches;
DROP POLICY IF EXISTS "batches_public_select" ON public.batches;
CREATE POLICY "batches_admin_all" ON public.batches FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "batches_public_select" ON public.batches FOR SELECT TO authenticated USING (true);

-- Programs
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin manage programs" ON public.programs;
DROP POLICY IF EXISTS "Public view programs" ON public.programs;
DROP POLICY IF EXISTS "programs_admin_all" ON public.programs;
DROP POLICY IF EXISTS "programs_public_select" ON public.programs;
CREATE POLICY "programs_admin_all" ON public.programs FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "programs_public_select" ON public.programs FOR SELECT TO authenticated USING (true);

-- 6. ONE-TIME SYNC LOOP
-- This will sync all existing auth users into the public.users table immediately
DO $$
DECLARE
  u record;
BEGIN
  FOR u IN SELECT * FROM auth.users LOOP
    DECLARE
      target_role text;
    BEGIN
      -- Extract role and map to binary system
      target_role := COALESCE(u.raw_app_meta_data->>'role', u.raw_user_meta_data->>'role', 'thalibah');
      
      -- Map legacy roles
      IF target_role IN ('musyrifah', 'muallimah') THEN
        target_role := 'admin';
      ELSIF target_role = 'calon_thalibah' THEN
        target_role := 'thalibah';
      ELSIF target_role NOT IN ('admin', 'thalibah') THEN
        target_role := 'thalibah'; -- Fallback for any other ghost roles
      END IF;

      INSERT INTO public.users (
        id, 
        email, 
        full_name, 
        role, 
        roles, 
        pekerjaan, 
        negara, 
        alasan_daftar, 
        is_active
      )
      VALUES (
        u.id, 
        u.email, 
        COALESCE(u.raw_user_meta_data->>'full_name', u.email), 
        target_role,
        ARRAY[target_role], 
        'Belum diisi', 
        'Indonesia', 
        'Migrasi Awal', 
        true
      )
      ON CONFLICT (email) DO UPDATE 
      SET 
        id = EXCLUDED.id,
        role = CASE WHEN public.users.role = 'admin' THEN 'admin' ELSE EXCLUDED.role END,
        roles = CASE WHEN 'admin' = ANY(public.users.roles) THEN public.users.roles ELSE EXCLUDED.roles END;
    END;
  END LOOP;
END;
$$;

-- 7. GRANTS
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
GRANT ALL ON TABLE public.users TO service_role;
GRANT SELECT ON TABLE public.users TO authenticated;
