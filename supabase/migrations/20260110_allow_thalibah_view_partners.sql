-- ============================================================================
-- Migration: Allow thalibah to view other selected thalibah for partner matching
-- Date: 2026-01-10
-- Description: Add SELECT policy to allow thalibah to view other selected thalibah
-- ============================================================================

-- Issue: Thalibah cannot see partner list in daftar ulang page because
-- RLS policy only allows viewing own registration data

-- Solution: Add policy to allow viewing other selected thalibah (selection_status='selected')
-- for partner matching purposes

CREATE POLICY "Authenticated users can view selected thalibah for partner matching"
ON pendaftaran_tikrar_tahfidz
FOR SELECT
TO authenticated
USING (selection_status = 'selected');

-- Note: This policy allows thalibah to see:
-- - Their own registration (via existing "allow_user_select_own_tikrar" policy)
-- - All selected thalibah (via this new policy)
-- This is necessary for the partner selection feature in daftar ulang
