-- Add phone field to users table
-- This fixes the 406 error when trying to select phone field

ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add comment to the new column
COMMENT ON COLUMN users.phone IS 'User phone number for contact purposes';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'phone';