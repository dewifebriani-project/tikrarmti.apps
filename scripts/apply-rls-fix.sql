-- 1. Robust Admin Check Function
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE 
      (id = auth.uid()) 
      AND (role = 'admin' OR 'admin' = ANY(roles))
  );
END;
$$;

-- 2. Identity Sync Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_auth_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  initial_role text;
BEGIN
  initial_role := COALESCE(
    new.raw_app_meta_data->>'role', 
    new.raw_user_meta_data->>'role', 
    'thalibah'
  );

  INSERT INTO public.users (id, email, full_name, role, roles, is_active)
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
    roles = CASE WHEN 'admin' = ANY(public.users.roles) THEN public.users.roles ELSE EXCLUDED.roles END,
    role = CASE WHEN public.users.role = 'admin' THEN 'admin' ELSE EXCLUDED.role END;

  RETURN new;
END;
$$;

-- 3. Update RLS Policy for core tables
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
CREATE POLICY "users_select_policy" ON public.users FOR SELECT TO authenticated USING ((auth.uid() = id) OR (auth.jwt()->>'email' = email) OR public.is_admin());

DROP POLICY IF EXISTS "users_all_policy" ON public.users;
CREATE POLICY "users_all_policy" ON public.users FOR ALL TO authenticated USING ((auth.uid() = id) OR public.is_admin());

DROP POLICY IF EXISTS "batches_admin_all" ON public.batches;
DROP POLICY IF EXISTS "batches_public_select" ON public.batches;
CREATE POLICY "batches_admin_all" ON public.batches FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "batches_public_select" ON public.batches FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "programs_admin_all" ON public.programs;
DROP POLICY IF EXISTS "programs_public_select" ON public.programs;
CREATE POLICY "programs_admin_all" ON public.programs FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "programs_public_select" ON public.programs FOR SELECT TO authenticated USING (true);

-- 4. Manual Fix for Dewi (Final push)
UPDATE public.users SET roles = ARRAY['admin'], role = 'admin' WHERE email = 'dewifebriani@gmail.com';
DELETE FROM public.users WHERE email = 'dewifebriani@gmail.com' AND id != 'eccdf0f7-e9e7-4284-bf8f-5b5816dcf682';
