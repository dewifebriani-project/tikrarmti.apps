-- ============================================================================
-- Migration: Fix Batches RLS Policies
-- Date: 2026-01-03
-- Description: Ensure authenticated users can read batches table
-- ============================================================================

-- First, disable RLS temporarily to ensure we can make changes
ALTER TABLE batches DISABLE ROW LEVEL SECURITY;

-- Now re-enable RLS
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Authenticated can view batches" ON batches;
DROP POLICY IF EXISTS "Admin can manage batches" ON batches;
DROP POLICY IF EXISTS "Service role can manage batches" ON batches;
DROP POLICY IF EXISTS "Public can view batches" ON batches;

-- Policy 1: Allow all authenticated users to view batches
CREATE POLICY "Authenticated can view batches"
ON batches
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Allow service role to do everything
CREATE POLICY "Service role can manage batches"
ON batches
FOR ALL
TO service_role
USING (true);

-- Policy 3: Allow admin to manage batches
CREATE POLICY "Admin can manage batches"
ON batches
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND ('admin' = ANY(users.roles) OR users.role = 'admin')
  )
);

-- Verify the policies are created
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
WHERE tablename = 'batches';
