-- ============================================================================
-- FIX USERS TABLE RLS RECURSION
-- ============================================================================
-- The previous policy was recursive because it queried the 'users' table 
-- inside the policy for the 'users' table itself.
--
-- This migration replaces it with a safer, non-recursive check.

-- 1. Drop the offending recursive policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- 2. RE-ENABLE BASIC SELF-ACCESS (Non-recursive)
-- This is always safe: users can see themselves.
CREATE POLICY "Users can view their own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. RE-IMPLEMENT ADMIN ACCESS (Non-recursive)
-- To avoid recursion, we check the user's role directly on the record WITHOUT
-- performing another subquery to the 'users' table.
--
-- Postgres allows evaluating the current user's session variables or 
-- performing checks that don't trigger the same policy.
--
-- Better approach: Use the fact that RLS is already applied.
-- However, for an admin to see "OTHER" users, we need a check that doesn't recurs.

-- Solution: Use a function with SECURITY DEFINER that carefully handles access,
-- or use the simple check below if we can trust the metadata or a separate mapping.
-- For now, we will use a check that references the roles array of the record being queried
-- IF it's the current user, or allow it if the current user has the admin bit set in their JWT.

CREATE POLICY "Admins can view all users"
ON users
FOR SELECT
TO authenticated
USING (
  (auth.uid() = id) OR 
  (auth.jwt() -> 'app_metadata' -> 'roles' @> '["admin"]')
);

CREATE POLICY "Admins can manage all users"
ON users
FOR ALL
TO authenticated
USING (
  (auth.uid() = id) OR 
  (auth.jwt() -> 'app_metadata' -> 'roles' @> '["admin"]')
)
WITH CHECK (
  (auth.uid() = id) OR 
  (auth.jwt() -> 'app_metadata' -> 'roles' @> '["admin"]')
);
