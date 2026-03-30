-- ============================================================================
-- FINAL ROBUST ADMIN ACCESS & RLS RECURSION FIX
-- ============================================================================
-- Resolution for RLS recursion and ID mismatch issues.
-- This migration provides a systemic fix for admin authorization.

-- 1. Create a robust handles-all-cases is_admin() function
-- This uses SECURITY DEFINER to bypass RLS inside the function.
-- It checks by ID first, then falls back to Email (from JWT) for ID mismatches.
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  is_adm boolean;
  current_email text;
BEGIN
  -- 1. Check by ID (Standard case)
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR 'admin' = ANY(roles))
  ) INTO is_adm;
  
  IF is_adm THEN RETURN TRUE; END IF;
  
  -- 2. Check by Email fallback (ID mismatch case)
  -- Uses auth.jwt() to get the email of the currently authenticated user
  current_email := auth.jwt() ->> 'email';
  IF current_email IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.users 
      WHERE email = current_email
      AND (role = 'admin' OR 'admin' = ANY(roles))
    ) INTO is_adm;
    
    IF is_adm THEN RETURN TRUE; END IF;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- 2. Drop all potentially recursive or broken policies on users table
-- We drop a wide variety of possible names to ensure a clean slate.
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view profiles" ON users;
DROP POLICY IF EXISTS "Users can manage profiles" ON users;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update own profile" ON users;
DROP POLICY IF EXISTS "Public access" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_all_policy" ON users;

-- 3. Implement Clean, Non-Recursive Policies
-- SELECT: Users can see themselves OR admins can see everyone
CREATE POLICY "users_select_policy" 
ON public.users FOR SELECT 
TO authenticated 
USING (
  (auth.uid() = id) OR 
  public.is_admin()
);

-- ALL (INSERT/UPDATE/DELETE): Users can manage themselves OR admins can manage everyone
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

-- 4. Enable RLS explicitly
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- 6. Verification query (run this manually to check status)
-- SELECT public.is_admin();
