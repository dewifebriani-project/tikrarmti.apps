-- Migration: Add akad_files Array Support
-- This migration adds support for multiple akad file uploads

-- Add the new akad_files column (JSONB array)
ALTER TABLE public.daftar_ulang_submissions
ADD COLUMN IF NOT EXISTS akad_files JSONB DEFAULT '[]'::jsonb;

-- Migrate existing data: convert single akad_url and akad_file_name to array format
UPDATE public.daftar_ulang_submissions
SET akad_files = JSONB_BUILD_ARRAY(
  JSONB_BUILD_OBJECT(
    'url', akad_url,
    'name', akad_file_name
  )
)
WHERE akad_url IS NOT NULL
  AND akad_file_name IS NOT NULL
  AND akad_files = '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.daftar_ulang_submissions.akad_files IS 'Array of uploaded akad files with structure: [{url: string, name: string}]';

-- Note: We keep the old columns (akad_url, akad_file_name) for backward compatibility
-- They can be dropped in a future migration once all data is confirmed migrated
-- COMMENT ON COLUMN public.daftar_ulang_submissions.akad_url IS 'DEPRECATED: Use akad_files instead';
-- COMMENT ON COLUMN public.daftar_ulang_submissions.akad_file_name IS 'DEPRECATED: Use akad_files instead';
