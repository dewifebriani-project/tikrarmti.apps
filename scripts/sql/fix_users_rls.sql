-- =====================================================
-- FIX USERS TABLE RLS POLICIES
-- =====================================================
-- Ensure users can see and update their own profiles
-- and admins have full access.
-- =====================================================

-- Enable RLS on users table (in case it's not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 1. Users can see their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- 2. Users can update their own profile (restricted columns)
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Users can insert their own profile (needed for first login/signup)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. Admins can view and manage all profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.users;
CREATE POLICY "Admins can manage all profiles"
  ON public.users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND (users.roles @> ARRAY['admin']::text[])
    )
  );

-- 5. Musyrifah can view profiles (for pairing/halaqah management)
DROP POLICY IF EXISTS "Musyrifah can view profiles" ON public.users;
CREATE POLICY "Musyrifah can view profiles"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND (users.roles @> ARRAY['musyrifah']::text[])
    )
  );
