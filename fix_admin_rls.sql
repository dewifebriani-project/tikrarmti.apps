-- Fix RLS policies for admin access to pendaftaran_tikrar_tahfidz
-- Run this in Supabase SQL Editor

-- 1. Ensure admin role can bypass RLS for this table
DROP POLICY IF EXISTS "Users can view their own tikrar applications" ON public.pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Users can insert their own tikrar applications" ON public.pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Users can update their own tikrar applications" ON public.pendaftaran_tikrar_tahfidz;

-- 2. Create admin policies
CREATE POLICY "Admins can view all tikrar applications"
ON public.pendaftaran_tikrar_tahfidz FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update all tikrar applications"
ON public.pendaftaran_tikrar_tahfidz FOR UPDATE
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 3. Create user policies for their own applications
CREATE POLICY "Users can view their own tikrar applications"
ON public.pendaftaran_tikrar_tahfidz FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  user_id = auth.uid()
);

CREATE POLICY "Users can insert their own tikrar applications"
ON public.pendaftaran_tikrar_tahfidz FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  user_id = auth.uid()
);

CREATE POLICY "Users can update their own tikrar applications"
ON public.pendaftaran_tikrar_tahfidz FOR UPDATE
USING (
  auth.role() = 'authenticated' AND
  user_id = auth.uid()
);

-- 4. Enable RLS on the table if not already enabled
ALTER TABLE public.pendaftaran_tikrar_tahfidz ENABLE ROW LEVEL SECURITY;

-- 5. Grant permissions
GRANT ALL ON public.pendaftaran_tikrar_tahfidz TO authenticated;
GRANT SELECT ON public.pendaftaran_tikrar_tahfidz TO anon;

-- 6. Verify current RLS status
SELECT schemaname, tablename, rowsecurity, forcerlspolicy
FROM pg_tables
WHERE tablename = 'pendaftaran_tikrar_tahfidz' AND schemaname = 'public';

-- 7. Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'pendaftaran_tikrar_tahfidz' AND schemaname = 'public';