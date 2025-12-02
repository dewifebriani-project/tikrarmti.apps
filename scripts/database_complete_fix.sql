-- Complete Database Fix for Tikr Armati Application
-- This script fixes all RLS policies and schema issues

-- First, let's check if the users table exists and has the correct structure
-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Service role bypass RLS" ON users;

-- Create comprehensive RLS policies for users table
CREATE POLICY "Enable read access for all users based on user_id" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable insert for authentication based users" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Service role bypass for admin operations
CREATE POLICY "Service role can bypass RLS" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Fix for profiles table if it exists (for backwards compatibility)
-- Check if profiles table exists and create/fix it if needed
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        -- Drop existing policies on profiles table
        DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
        DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

        -- Create policies for profiles table
        CREATE POLICY "Enable read access for all users based on user_id" ON profiles
            FOR SELECT USING (auth.uid() = id);

        CREATE POLICY "Enable insert for authentication based users" ON profiles
            FOR INSERT WITH CHECK (auth.uid() = id);

        CREATE POLICY "Enable update for users based on user_id" ON profiles
            FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

-- Function to create user profile automatically after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a user profile for the new authenticated user
    INSERT INTO public.users (id, email, full_name, role, password_hash)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.email),
        COALESCE(new.raw_user_meta_data->>'role', 'thalibah'),
        'managed_by_auth_system'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Success confirmation
SELECT 'Database fix completed successfully!' as result;

-- Verify policies
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
WHERE tablename IN ('users', 'profiles')
ORDER BY tablename, policyname;