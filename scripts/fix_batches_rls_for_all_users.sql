-- Fix RLS Policy untuk tabel batches
-- Masalah: Hanya admin yang bisa view batches, sehingga card pendaftaran tidak muncul untuk user biasa
-- Solusi: Izinkan semua authenticated users untuk VIEW batches, tapi tetap restrict INSERT/UPDATE/DELETE untuk admin

-- Step 1: Drop existing SELECT policy yang restrictive
DROP POLICY IF EXISTS "Admins can view all batches" ON public.batches;
DROP POLICY IF EXISTS "Authenticated users can view batches" ON public.batches;
DROP POLICY IF EXISTS "All users can view open batches" ON public.batches;

-- Step 2: Create new SELECT policy - Allow ALL authenticated users to view batches
CREATE POLICY "Authenticated users can view batches" ON public.batches
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Step 3: Keep admin-only policies for INSERT, UPDATE, DELETE (drop and recreate to ensure consistency)
DROP POLICY IF EXISTS "Admins can insert batches" ON public.batches;
DROP POLICY IF EXISTS "Admins can update batches" ON public.batches;
DROP POLICY IF EXISTS "Admins can delete batches" ON public.batches;

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

-- Step 4: Verify RLS is enabled
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify permissions
GRANT SELECT ON public.batches TO authenticated;
GRANT ALL ON public.batches TO service_role;

-- Query untuk verify policies setelah run
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'batches'
ORDER BY policyname;
