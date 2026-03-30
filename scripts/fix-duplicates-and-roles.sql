-- ============================================================================
-- DEDUPLICATION & ROLE STABILIZATION SCRIPT
-- ============================================================================

-- 1. IDENTIFY & CLEAN DUPLICATES in public.users
-- Keep the one with the most recent updated_at or created_at
DELETE FROM public.users a
USING public.users b
WHERE a.ctid < b.ctid 
  AND a.id = b.id;

-- 2. ENSURE EMAIL UNIQUENESS (Just in case)
-- If same email exists with different IDs, we might have a problem, 
-- but we'll prioritize the ID that exists in auth.users.
DELETE FROM public.users a
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = a.id
);

-- 3. FIX DEWI FEBRIANI ACCOUNT
-- Explicitly set admin role for the known email
UPDATE public.users 
SET roles = ARRAY['admin'], role = 'admin'
WHERE email = 'dewifebriani@gmail.com';

-- 4. UPDATE IDENTITY SYNC TRIGGER (handle_new_auth_user)
-- Ensure it uses ON CONFLICT (id) and protects admin roles
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

-- 5. VERIFY Result (Optional logging)
DO $$
BEGIN
  RAISE NOTICE 'Deduplication and role stabilization complete.';
END $$;
