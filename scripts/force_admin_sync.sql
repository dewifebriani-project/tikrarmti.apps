-- FORCE FIX FOR DEWI FEBRIANI ACCOUNT SYNC
DO $$
DECLARE
  v_auth_id uuid;
  v_email text := 'dewifebriani@gmail.com';
BEGIN
  -- 1. Get current auth ID
  SELECT id INTO v_auth_id FROM auth.users WHERE email = v_email;
  
  IF v_auth_id IS NOT NULL THEN
    RAISE NOTICE 'Found Auth ID: %', v_auth_id;
    
    -- 2. Ensure record exists in public.users with CORRECT ID and ADMIN role
    INSERT INTO public.users (
      id, 
      email, 
      full_name, 
      role, 
      roles, 
      is_active,
      created_at,
      updated_at
    ) 
    VALUES (
      v_auth_id, 
      v_email, 
      'Dewi Febriani', 
      'admin', 
      ARRAY['admin'], 
      true, 
      now(), 
      now()
    )
    ON CONFLICT (id) DO UPDATE SET 
      email = EXCLUDED.email,
      role = 'admin',
      roles = ARRAY['admin'],
      is_active = true,
      updated_at = now();
      
    -- 3. Cleanup: If there was a different ID for this email, delete it (avoid duplicates)
    DELETE FROM public.users WHERE email = v_email AND id != v_auth_id;
    
    RAISE NOTICE 'User record forced into public.users with admin role.';
  ELSE
    RAISE NOTICE 'User not found in auth.users by email: %', v_email;
  END IF;
END $$;
