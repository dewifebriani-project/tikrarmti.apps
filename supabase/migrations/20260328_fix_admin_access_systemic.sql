-- ==========================================
-- SYSTEMIC FIX: Administrative Role Access
-- ==========================================
-- Resolution for RLS recursion issues on the 'users' table.
-- Using SECURITY DEFINER to check admin roles without infinite loops.

-- 1. Create a function that bypasses RLS safely to check admin status
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR 'admin' = ANY(roles))
  );
$$;

-- 2. Drop legacy policies that cause recursion or dependency issues
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- 3. Implement non-recursive policies for the 'users' table
-- Everyone can view their own profile, OR an admin can view everyone.
CREATE POLICY "Users can view profiles" 
ON users FOR SELECT 
TO authenticated 
USING (
  (auth.uid() = id) OR 
  is_admin()
);

-- Admins can update any user, users can update themselves.
CREATE POLICY "Users can manage profiles" 
ON users FOR ALL 
TO authenticated 
USING (
  (auth.uid() = id) OR 
  is_admin()
)
WITH CHECK (
  (auth.uid() = id) OR 
  is_admin()
);

-- 4. Apply systemic protection to other tables if needed
-- (Optional, but ensures consistency)
-- DROP POLICY IF EXISTS "Admins can view all registrations" ON pendaftaran_tikrar_tahfidz;
-- CREATE POLICY "Admins can view all registrations" ON pendaftaran_tikrar_tahfidz FOR SELECT TO authenticated USING (is_admin());

-- 5. VERIFICATION:
-- Run 'SELECT is_admin();' as a logged-in user to verify.
