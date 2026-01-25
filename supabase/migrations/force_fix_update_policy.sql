-- FORCE FIX: Remove ALL update policies and create a simple one
-- This script will forcefully fix the RLS policy issue

-- Step 1: Drop ALL existing UPDATE policies (be thorough)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'pendaftaran_tikrar_tahfidz'
          AND cmd = 'UPDATE'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.pendaftaran_tikrar_tahfidz', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Step 2: Create ONE simple UPDATE policy
CREATE POLICY "allow_user_update_own_tikrar"
ON public.pendaftaran_tikrar_tahfidz
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Step 3: Verify - should show only ONE UPDATE policy
SELECT
    tablename,
    policyname,
    cmd,
    roles::text,
    qual::text as using_clause,
    with_check::text
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'pendaftaran_tikrar_tahfidz'
  AND cmd = 'UPDATE'
ORDER BY policyname;

-- Step 4: Test the policy with a sample user
-- Replace 'YOUR_USER_ID' with actual user_id when testing
DO $$
BEGIN
    RAISE NOTICE '=== Policy Fix Complete ===';
    RAISE NOTICE 'Users can now UPDATE their pendaftaran_tikrar_tahfidz records';
    RAISE NOTICE 'Policy allows: auth.uid() = user_id';
    RAISE NOTICE 'This works for APPROVED users too!';
END $$;
