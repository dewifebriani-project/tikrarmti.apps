-- ============================================================================
-- Migration: Fix RLS policies for muallimah_registrations and musyrifah_registrations
-- Date: 2026-01-03
-- Description: Add admin access to view all registrations
-- ============================================================================

-- Add policy for admins to view all muallimah registrations
CREATE POLICY "Admins can view all muallimah registrations"
ON muallimah_registrations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND 'admin' = ANY(users.roles)
  )
);

-- Add policy for admins to manage all muallimah registrations
CREATE POLICY "Admins can manage all muallimah registrations"
ON muallimah_registrations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND 'admin' = ANY(users.roles)
  )
);

-- Add policy for admins to view all musyrifah registrations
CREATE POLICY "Admins can view all musyrifah registrations"
ON musyrifah_registrations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND 'admin' = ANY(users.roles)
  )
);

-- Add policy for admins to manage all musyrifah registrations
CREATE POLICY "Admins can manage all musyrifah registrations"
ON musyrifah_registrations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND 'admin' = ANY(users.roles)
  )
);
