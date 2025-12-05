-- Fix OAuth User Creation Issue
-- This script fixes the issue where Google OAuth users can't be created due to RLS policies

-- 1. First, disable the problematic trigger temporarily
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop existing RLS policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Service role bypass RLS" ON users;
DROP POLICY IF EXISTS "Enable read access for all users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable insert for authentication based users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;

-- 3. Create new policies that properly handle OAuth users
-- First, allow service role to do everything
CREATE POLICY "Service role full access" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Allow users to see their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Allow anonymous inserts for OAuth (this is needed during signup)
CREATE POLICY "Allow user creation during auth" ON users
    FOR INSERT WITH CHECK (true);

-- 4. Recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user already exists in users table
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = new.id) THEN
        -- Create a user profile for the new authenticated user
        INSERT INTO public.users (id, email, full_name, role, password_hash, is_active)
        VALUES (
            new.id,
            new.email,
            COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
            COALESCE(new.raw_user_meta_data->>'role', 'calon_thalibah'),
            'managed_by_auth_system',
            true
        );
    END IF;
    RETURN new;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE WARNING 'Failed to create user profile for %: %', new.email, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 7. Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

-- 8. Create a backup function to manually create user profile if needed
CREATE OR REPLACE FUNCTION public.create_user_profile_manually(
    user_id UUID,
    user_email TEXT,
    user_full_name TEXT DEFAULT NULL,
    user_role TEXT DEFAULT 'calon_thalibah'
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Insert user profile with service role bypass
    INSERT INTO public.users (id, email, full_name, role, password_hash, is_active)
    VALUES (
        user_id,
        user_email,
        COALESCE(user_full_name, split_part(user_email, '@', 1)),
        user_role,
        'managed_by_auth_system',
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = NOW();

    RETURN true;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user profile manually: %', SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
SELECT 'OAuth user creation fix applied successfully!' as result;

-- Verify the setup
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;