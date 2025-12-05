-- Fix Row Level Security policies for admin access
-- Run this in Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own batches" ON public.batches;
DROP POLICY IF EXISTS "Users can insert own batches" ON public.batches;
DROP POLICY IF EXISTS "Users can update own batches" ON public.batches;
DROP POLICY IF EXISTS "Users can delete own batches" ON public.batches;

-- Create new policies that allow admin users full access
CREATE POLICY "Admins can view all batches" ON public.batches
    FOR SELECT
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM public.users WHERE role = 'admin'
        )
    );

CREATE POLICY "Admins can insert batches" ON public.batches
    FOR INSERT
    WITH CHECK (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM public.users WHERE role = 'admin'
        )
    );

CREATE POLICY "Admins can update batches" ON public.batches
    FOR UPDATE
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM public.users WHERE role = 'admin'
        )
    )
    WITH CHECK (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM public.users WHERE role = 'admin'
        )
    );

CREATE POLICY "Admins can delete batches" ON public.batches
    FOR DELETE
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM public.users WHERE role = 'admin'
        )
    );

-- Also fix programs table RLS
DROP POLICY IF EXISTS "Users can view own programs" ON public.programs;
DROP POLICY IF EXISTS "Users can insert own programs" ON public.programs;
DROP POLICY IF EXISTS "Users can update own programs" ON public.programs;
DROP POLICY IF EXISTS "Users can delete own programs" ON public.programs;

CREATE POLICY "Admins can view all programs" ON public.programs
    FOR SELECT
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM public.users WHERE role = 'admin'
        )
    );

CREATE POLICY "Admins can insert programs" ON public.programs
    FOR INSERT
    WITH CHECK (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM public.users WHERE role = 'admin'
        )
    );

CREATE POLICY "Admins can update programs" ON public.programs
    FOR UPDATE
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM public.users WHERE role = 'admin'
        )
    )
    WITH CHECK (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM public.users WHERE role = 'admin'
        )
    );

CREATE POLICY "Admins can delete programs" ON public.programs
    FOR DELETE
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM public.users WHERE role = 'admin'
        )
    );

-- Also fix halaqah table RLS
DROP POLICY IF EXISTS "Users can view own halaqah" ON public.halaqah;
DROP POLICY IF EXISTS "Users can insert own halaqah" ON public.halaqah;
DROP POLICY IF EXISTS "Users can update own halaqah" ON public.halaqah;
DROP POLICY IF EXISTS "Users can delete own halaqah" ON public.halaqah;

CREATE POLICY "Admins can view all halaqah" ON public.halaqah
    FOR SELECT
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM public.users WHERE role = 'admin'
        )
    );

CREATE POLICY "Admins can insert halaqah" ON public.halaqah
    FOR INSERT
    WITH CHECK (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM public.users WHERE role = 'admin'
        )
    );

CREATE POLICY "Admins can update halaqah" ON public.halaqah
    FOR UPDATE
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM public.users WHERE role = 'admin'
        )
    )
    WITH CHECK (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM public.users WHERE role = 'admin'
        )
    );

CREATE POLICY "Admins can delete halaqah" ON public.halaqah
    FOR DELETE
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM public.users WHERE role = 'admin'
        )
    );

-- Make sure RLS is enabled on these tables
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halaqah ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.batches TO authenticated;
GRANT ALL ON public.programs TO authenticated;
GRANT ALL ON public.halaqah TO authenticated;