-- =====================================================
-- Add negara (country) field to users table
-- =====================================================
-- This script adds a negara field to support international users

-- Add negara field to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS negara VARCHAR(100) DEFAULT 'Indonesia';

-- Add comment for documentation
COMMENT ON COLUMN users.negara IS 'Country of residence (Indonesia, United Kingdom, etc.)';

-- Update existing records to have Indonesia as default country (for records that might have NULL)
UPDATE users
SET negara = 'Indonesia'
WHERE negara IS NULL OR negara = '';

-- Verify the field was added correctly
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name = 'negara';