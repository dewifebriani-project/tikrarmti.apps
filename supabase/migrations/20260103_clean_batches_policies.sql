-- ============================================================================
-- Migration: Clean and Simplify Batches RLS Policies
-- Date: 2026-01-03
-- Description: Remove all conflicting policies and create simple ones
-- ============================================================================

-- Drop ALL existing policies on batches table
DROP POLICY IF EXISTS "Admins can insert batches" ON batches;
DROP POLICY IF EXISTS "batches_insert_admin" ON batches;
DROP POLICY IF EXISTS "batches_select_all" ON batches;
DROP POLICY IF EXISTS "Admins can update batches" ON batches;
DROP POLICY IF EXISTS "batches_update_admin" ON batches;
DROP POLICY IF EXISTS "Authenticated can view batches" ON batches;
DROP POLICY IF EXISTS "Service role can manage batches" ON batches;
DROP POLICY IF EXISTS "Admin can manage batches" ON batches;
DROP POLICY IF EXISTS "Public can view batches" ON batches;

-- Create simple, non-conflicting policies

-- Policy 1: All authenticated users can SELECT (view) batches
CREATE POLICY "Enable read access for all authenticated users"
ON batches
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Service role can do everything
CREATE POLICY "Enable all for service role"
ON batches
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify the policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'batches'
ORDER BY policyname;
