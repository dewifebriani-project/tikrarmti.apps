-- ============================================================================
-- Migration: Add Zoom Link to Halaqah
-- Date: 2026-01-03
-- Description: Add zoom_link field to halaqah table for online class meetings
-- ============================================================================

-- Add zoom_link column to halaqah table
ALTER TABLE halaqah
ADD COLUMN IF NOT EXISTS zoom_link text;

-- Add comment
COMMENT ON COLUMN halaqah.zoom_link IS 'Zoom meeting link for halaqah sessions, accessible by muallimah, musyrifah, thalibah, and admin';
