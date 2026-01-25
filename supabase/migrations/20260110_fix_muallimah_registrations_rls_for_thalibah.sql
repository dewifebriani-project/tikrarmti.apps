-- ============================================================================
-- Migration: Fix RLS policies for thalibah halaqah access
-- Date: 2026-01-10
-- Description: Allow thalibah to view halaqah and muallimah registrations
-- ============================================================================

-- Issue: Thalibah could not see any halaqah in daftar ulang page because:
-- 1. muallimah_registrations RLS blocked thalibah from reading preferred_juz
-- 2. halaqah table RLS only allowed admin access

-- Solution 1: Allow thalibah to view approved muallimah registrations
CREATE POLICY "Authenticated users can view approved muallimah registrations"
ON muallimah_registrations
FOR SELECT
TO authenticated
USING (status = 'approved');

-- Solution 2: Fix halaqah RLS policies
-- Drop old admin-only policies
DROP POLICY IF EXISTS "Admins can view all halaqah" ON halaqah;
DROP POLICY IF EXISTS "Admins can insert halaqah" ON halaqah;
DROP POLICY IF EXISTS "Admins can update halaqah" ON halaqah;
DROP POLICY IF EXISTS "Admins can delete halaqah" ON halaqah;

-- Policy: All authenticated users can view halaqah
CREATE POLICY "Authenticated can view halaqah"
ON halaqah
FOR SELECT
TO authenticated
USING (true);

-- Policy: Admin can manage all halaqah
CREATE POLICY "Admin can manage all halaqah"
ON halaqah
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'admin' OR 'admin' = ANY(users.roles))
  )
);
