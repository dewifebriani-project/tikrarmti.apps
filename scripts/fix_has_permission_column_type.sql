-- Check the current column type for has_permission
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name IN ('tikrar_tahfidz', 'pendaftaran_tikrar_tahfidz')
    AND table_schema = 'public'
    AND column_name = 'has_permission';

-- Fix the column type if it's boolean
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Check if tikrar_tahfidz table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'tikrar_tahfidz'
        AND table_schema = 'public'
        AND table_type = 'BASE TABLE'
    ) INTO table_exists;

    IF table_exists THEN
        -- Drop any existing constraints on has_permission
        IF EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'tikrar_tahfidz_has_permission_check'
        ) THEN
            ALTER TABLE tikrar_tahfidz
            DROP CONSTRAINT tikrar_tahfidz_has_permission_check;
            RAISE NOTICE 'Dropped constraint: tikrar_tahfidz_has_permission_check';
        END IF;

        -- Change column type from boolean to text
        -- First, create a temporary column to store values
        ALTER TABLE tikrar_tahfidz ADD COLUMN IF NOT EXISTS has_permission_new TEXT;

        -- Convert boolean values to text
        UPDATE tikrar_tahfidz
        SET has_permission_new =
            CASE
                WHEN has_permission = true THEN 'yes'
                WHEN has_permission = false THEN ''
                ELSE ''
            END;

        -- Drop the old boolean column
        ALTER TABLE tikrar_tahfidz DROP COLUMN has_permission;

        -- Rename the new column
        ALTER TABLE tikrar_tahfidz RENAME COLUMN has_permission_new TO has_permission;

        -- Add the check constraint
        ALTER TABLE tikrar_tahfidz
        ADD CONSTRAINT tikrar_tahfidz_has_permission_check CHECK (
            has_permission IN ('yes', 'janda', '')
        );

        RAISE NOTICE 'Fixed has_permission column type in tikrar_tahfidz table';
    END IF;
END
$$;

-- Also fix pendaftaran_tikrar_tahfidz if it exists
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Check if pendaftaran_tikrar_tahfidz table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'pendaftaran_tikrar_tahfidz'
        AND table_schema = 'public'
    ) INTO table_exists;

    IF table_exists THEN
        -- Drop any existing constraints on has_permission
        IF EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'pendaftaran_tikrar_tahfidz_has_permission_check'
        ) THEN
            ALTER TABLE pendaftaran_tikrar_tahfidz
            DROP CONSTRAINT pendaftaran_tikrar_tahfidz_has_permission_check;
            RAISE NOTICE 'Dropped constraint: pendaftaran_tikrar_tahfidz_has_permission_check';
        END IF;

        -- Change column type from boolean to text
        ALTER TABLE pendaftaran_tikrar_tahfidz ADD COLUMN IF NOT EXISTS has_permission_new TEXT;

        UPDATE pendaftaran_tikrar_tahfidz
        SET has_permission_new =
            CASE
                WHEN has_permission = true THEN 'yes'
                WHEN has_permission = false THEN ''
                ELSE ''
            END;

        ALTER TABLE pendaftaran_tikrar_tahfidz DROP COLUMN has_permission;
        ALTER TABLE pendaftaran_tikrar_tahfidz RENAME COLUMN has_permission_new TO has_permission;

        ALTER TABLE pendaftaran_tikrar_tahfidz
        ADD CONSTRAINT pendaftaran_tikrar_tahfidz_has_permission_check CHECK (
            has_permission IN ('yes', 'janda', '')
        );

        RAISE NOTICE 'Fixed has_permission column type in pendaftaran_tikrar_tahfidz table';
    END IF;
END
$$;

-- Verify the changes
SELECT
    tc.table_name,
    c.column_name,
    c.data_type,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.columns c
LEFT JOIN information_schema.table_constraints tc ON c.table_name = tc.table_name
    AND tc.constraint_name LIKE '%has_permission%'
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE c.table_name IN ('tikrar_tahfidz', 'pendaftaran_tikrar_tahfidz')
    AND c.table_schema = 'public'
    AND c.column_name = 'has_permission';