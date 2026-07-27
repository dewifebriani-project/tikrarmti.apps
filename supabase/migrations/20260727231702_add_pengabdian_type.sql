-- Add pengabdian_type to daftar_ulang_submissions
ALTER TABLE daftar_ulang_submissions 
ADD COLUMN IF NOT EXISTS pengabdian_type character varying(50);
