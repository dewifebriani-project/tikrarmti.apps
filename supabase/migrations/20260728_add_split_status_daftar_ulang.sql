-- Add new status columns
ALTER TABLE daftar_ulang_submissions
ADD COLUMN IF NOT EXISTS akad_status VARCHAR(50) DEFAULT 'draft' NOT NULL,
ADD COLUMN IF NOT EXISTS partner_status VARCHAR(50) DEFAULT 'draft' NOT NULL;

-- Backfill from existing status
UPDATE daftar_ulang_submissions
SET 
  akad_status = status,
  partner_status = status
WHERE akad_status = 'draft' AND partner_status = 'draft';

-- Update views/policies if necessary (RLS usually depends on user_id, not status, but just in case)
