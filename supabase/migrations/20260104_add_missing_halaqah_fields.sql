-- ============================================================================
-- Migration: Add missing fields to halaqah table
-- Date: 2026-01-04
-- Description: Add muallimah_id, waitlist_max, and preferred_juz fields
-- ============================================================================

-- Add muallimah_id to track which muallimah leads the halaqah
ALTER TABLE halaqah
ADD COLUMN IF NOT EXISTS muallimah_id uuid REFERENCES users(id);

-- Add waitlist_max for maximum students in waitlist
ALTER TABLE halaqah
ADD COLUMN IF NOT EXISTS waitlist_max integer DEFAULT 5;

-- Add preferred_juz for filtering and matching
ALTER TABLE halaqah
ADD COLUMN IF NOT EXISTS preferred_juz text;

-- Add comments
COMMENT ON COLUMN halaqah.muallimah_id IS 'Primary muallimah (ustadzah) who leads this halaqah';
COMMENT ON COLUMN halaqah.waitlist_max IS 'Maximum number of students allowed in waitlist (default: 5)';
COMMENT ON COLUMN halaqah.preferred_juz IS 'Preferred juz for this halaqah (copied from muallimah registration)';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_halaqah_muallimah_id ON halaqah(muallimah_id);
CREATE INDEX IF NOT EXISTS idx_halaqah_preferred_juz ON halaqah(preferred_juz);
