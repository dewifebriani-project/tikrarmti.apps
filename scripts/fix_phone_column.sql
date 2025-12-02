-- Fix missing phone column in users table
-- Execute this script to resolve the 406 error when selecting phone field

-- First check if the phone column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='users'
        AND column_name='phone'
        AND table_schema='public'
    ) THEN
        -- Add phone column if it doesn't exist
        ALTER TABLE users
        ADD COLUMN phone TEXT;

        -- Add comment
        COMMENT ON COLUMN users.phone IS 'User phone number for contact purposes';

        RAISE NOTICE 'Phone column added to users table';
    ELSE
        RAISE NOTICE 'Phone column already exists in users table';
    END IF;
END $$;

-- Verify the column exists
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name = 'phone'
AND table_schema = 'public';