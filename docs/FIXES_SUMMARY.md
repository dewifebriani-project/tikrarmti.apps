# Database and Code Fixes for Tikrar MTI Apps

## Issues Found

1. **406 Not Acceptable Error**: The Supabase API was returning a 406 error because user profile doesn't exist in the `users` table, only in `auth.users`
2. **userData is not defined**: In `AuthenticatedLayout.tsx`, there was a reference to `userData` which should be `user`
3. **Missing INSERT Policy**: The users table was missing proper INSERT policies for new user registration
4. **Schema Mismatch**: The TypeScript definitions referenced `profiles` table but the actual database has `users` table
5. **Password Hash Issue**: The users table has a password_hash column but passwords should be managed by auth.users only

## Fixes Applied

### 1. Database RLS Policies (database_complete_fix.sql)

```sql
-- Drop conflicting policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create comprehensive RLS policies
CREATE POLICY "Enable read access for all users based on user_id" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable insert for authentication based users" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Service role bypass for admin operations
CREATE POLICY "Service role can bypass RLS" ON users
    FOR ALL USING (auth.role() = 'service_role');
```

### 2. Fixed AuthenticatedLayout.tsx

- Changed `userData` references to `user`
- Fixed dependency array in useEffect
- Updated role checking logic to use correct user object

### 3. Updated TypeScript Definitions (lib/supabase.ts)

- Changed `profiles` table reference to `users` table
- Updated role types to match database schema: `'admin' | 'musyrifah' | 'muallimah' | 'thalibah'`

### 4. Fixed Registration Process (lib/auth.ts)

- Updated `registerWithEmail` to properly call `createUserProfile`
- Removed `password_hash` from profile creation since it's managed by auth.users
- Added proper error handling and logging

### 5. Auto-profile Creation Trigger

```sql
-- Function to create user profile automatically after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.email),
        COALESCE(new.raw_user_meta_data->>'role', 'thalibah')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Implementation Steps

### Step 1: Apply Database Fixes
1. Run `database_complete_fix.sql` in your Supabase SQL editor
2. Run the schema fix to remove password_hash constraints if needed

### Step 2: Update Code
1. The TypeScript fixes in `lib/supabase.ts` are already applied
2. The AuthenticatedLayout fixes are already applied
3. The auth.ts registration fixes are already applied

### Step 3: Test the Fixes
1. Try registering a new user
2. Check if user profile is created automatically
3. Verify user can log in without 406 errors
4. Test admin access with different user roles

## Expected Results After Fixes

1. **No more 406 errors**: User profiles will be found in database
2. **No more 'userData is not defined' errors**: AuthenticatedLayout will work correctly
3. **Automatic profile creation**: New users will have profiles created automatically
4. **Proper RLS enforcement**: Users can only access their own data
5. **Working registration**: New user registration will work end-to-end

## Verification Queries

To verify the fixes are working, run these queries in Supabase:

```sql
-- Check if policies are correctly applied
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
WHERE tablename = 'users'
ORDER BY policyname;

-- Check if trigger exists
SELECT
    tgname,
    tgrelid::regclass,
    tgfoid::regproc,
    tgtype,
    tgenabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- Check users table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

## Troubleshooting

If issues persist after applying these fixes:

1. **Check Supabase Logs**: Look for any RLS policy violations in the Supabase dashboard
2. **Verify Environment Variables**: Ensure `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` is set correctly
3. **Clear Browser Cache**: Clear localStorage and cookies to ensure fresh authentication state
4. **Check User Metadata**: Verify user roles are properly set in auth.users metadata

The fixes address all the root causes of the authentication and database access issues you were experiencing.