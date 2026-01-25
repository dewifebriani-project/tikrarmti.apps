-- ============================================================================
-- Migration: Add class_type to programs table
-- Date: 2026-01-03
-- Description: Add class_type field to programs table to categorize program types
-- ============================================================================

-- Add class_type column to programs table
ALTER TABLE programs
ADD COLUMN IF NOT EXISTS class_type text;

-- Add check constraint for valid class_type values
ALTER TABLE programs
DROP CONSTRAINT IF EXISTS programs_class_type_check;

ALTER TABLE programs
ADD CONSTRAINT programs_class_type_check
CHECK (
  class_type IS NULL OR
  class_type IN (
    'tikrar_tahfidz',
    'pra_tahfidz',
    'tashih_only',
    'ujian_only',
    'tashih_ujian'
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_programs_class_type
ON programs(class_type);

-- Add comment
COMMENT ON COLUMN programs.class_type IS 'Type of program: tikrar_tahfidz, pra_tahfidz, tashih_only, ujian_only, tashih_ujian';
