-- 1. Update the handle_new_auth_user function to use 'thalibah' as default
CREATE OR REPLACE FUNCTION public.handle_new_auth_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  initial_role text;
BEGIN
  -- Determine role from metadata if present
  -- Default to 'thalibah' (Binary Architecture)
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
  ON CONFLICT (email) DO UPDATE 
  SET 
    id = EXCLUDED.id,
    email = EXCLUDED.email,
    -- Keep existing roles if they contain 'admin' to prevent downgrade
    roles = CASE 
      WHEN 'admin' = ANY(public.users.roles) THEN public.users.roles
      ELSE EXCLUDED.roles
    END;

  RETURN new;
END;
$$;

-- 2. Drop the legacy trigger that manages calon_thalibah
DROP TRIGGER IF EXISTS trigger_daftar_ulang_approval_role ON public.daftar_ulang_submissions;
DROP FUNCTION IF EXISTS handle_daftar_ulang_approval();

-- 3. Fix Dewi Febriani's account
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM public.users WHERE email = 'dewifebriani@gmail.com';
  
  IF v_user_id IS NOT NULL THEN
    -- Clean roles and ensure admin is present
    UPDATE public.users 
    SET roles = ARRAY['admin'], role = 'admin'
    WHERE id = v_user_id;
    
    -- Also update auth metadata to prevent re-sync issues
    -- This is tricky as we need to update auth.users
    -- But we can at least fix the public table first.
  END IF;
END $$;
