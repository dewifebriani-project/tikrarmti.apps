-- Check the function definition
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'update_updated_at_column';

-- If function exists, check what it does and fix it
-- The function likely tries to set NEW.updated_at = NOW()
-- We need to either:
-- 1. Drop the function entirely, OR
-- 2. Modify the function to NOT set updated_at since the table doesn't have this column

-- Option 1: Drop the function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Option 2: If you want to keep it for other tables, modify it to check if column exists first
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set updated_at if the column exists in the table
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = TG_RELID::regclass::text
    AND column_name = 'updated_at'
  ) THEN
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Then drop the trigger on muallimah_registrations
DROP TRIGGER IF EXISTS update_muallimah_registrations_reviewed_at ON muallimah_registrations;

-- Also check for musyrifah_registrations
DROP TRIGGER IF EXISTS update_musyrifah_registrations_reviewed_at ON musyrifah_registrations;
