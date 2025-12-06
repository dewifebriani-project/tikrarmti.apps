-- Migration: Add negara (country) column to users table
-- Date: 2025-12-06
-- Description: Add support for international users (Malaysia, Australia, etc.)

-- Add negara column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS negara VARCHAR(100);

-- Set default value 'Indonesia' for existing users
UPDATE users
SET negara = 'Indonesia'
WHERE negara IS NULL;

-- Make negara NOT NULL after setting defaults
ALTER TABLE users
ALTER COLUMN negara SET NOT NULL;

-- Add comment to the column
COMMENT ON COLUMN users.negara IS 'Negara asal peserta (Indonesia, Malaysia, Australia, Negara Lainnya)';

-- Update provinsi to allow NULL for non-Indonesia users
ALTER TABLE users
ALTER COLUMN provinsi DROP NOT NULL;

COMMENT ON COLUMN users.provinsi IS 'Provinsi (hanya untuk peserta dari Indonesia)';

-- Create index for faster queries by country
CREATE INDEX IF NOT EXISTS idx_users_negara ON users(negara);

-- Display migration result
SELECT
  'Migration completed successfully' as status,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE negara = 'Indonesia') as indonesian_users,
  COUNT(*) FILTER (WHERE negara != 'Indonesia') as international_users
FROM users;
