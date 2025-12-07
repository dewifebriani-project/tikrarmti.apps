-- Simple fix for has_permission constraint violation
-- Run this in your Supabase SQL Editor

-- 1. First, drop any existing constraints
ALTER TABLE tikrar_tahfidz DROP CONSTRAINT IF EXISTS tikrar_tahfidz_has_permission_check;

-- 2. Make sure the column is text type (if it's not already)
-- If the column is boolean, we need to recreate it
DO $$
BEGIN
    -- Check column type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tikrar_tahfidz'
        AND column_name = 'has_permission'
        AND data_type = 'boolean'
    ) THEN
        -- Convert boolean to text
        ALTER TABLE tikrar_tahfidz ADD COLUMN has_permission_temp TEXT;
        UPDATE tikrar_tahfidz SET has_permission_temp = CASE WHEN has_permission THEN 'yes' ELSE '' END;
        ALTER TABLE tikrar_tahfidz DROP COLUMN has_permission;
        ALTER TABLE tikrar_tahfidz RENAME COLUMN has_permission_temp TO has_permission;
        RAISE NOTICE 'Converted boolean to text';
    END IF;
END
$$;

-- 3. Add the correct constraint for string values
ALTER TABLE tikrar_tahfidz
ADD CONSTRAINT tikrar_tahfidz_has_permission_check
CHECK (has_permission IN ('yes', 'janda', ''));

-- 4. Verify the fix
SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'tikrar_tahfidz'
AND column_name = 'has_permission';