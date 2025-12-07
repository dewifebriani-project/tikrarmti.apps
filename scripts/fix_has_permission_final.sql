-- Fix for has_permission column - correcting the data type mismatch

-- First, let's check the current state
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('tikrar_tahfidz', 'pendaftaran_tikrar_tahfidz')
    AND table_schema = 'public'
    AND column_name = 'has_permission';

-- Drop any existing constraints first
DO $$
BEGIN
    -- For tikrar_tahfidz table
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'tikrar_tahfidz_has_permission_check'
    ) THEN
        ALTER TABLE tikrar_tahfidz
        DROP CONSTRAINT tikrar_tahfidz_has_permission_check;
        RAISE NOTICE 'Dropped constraint: tikrar_tahfidz_has_permission_check';
    END IF;

    -- For pendaftaran_tikrar_tahfidz table
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'pendaftaran_tikrar_tahfidz_has_permission_check'
    ) THEN
        ALTER TABLE pendaftaran_tikrar_tahfidz
        DROP CONSTRAINT pendaftaran_tikrar_tahfidz_has_permission_check;
        RAISE NOTICE 'Dropped constraint: pendaftaran_tikrar_tahfidz_has_permission_check';
    END IF;
END
$$;

-- Check if the column is already text/varchar type
DO $$
DECLARE
    column_type TEXT;
BEGIN
    -- Get column type for tikrar_tahfidz
    SELECT data_type INTO column_type
    FROM information_schema.columns
    WHERE table_name = 'tikrar_tahfidz'
        AND table_schema = 'public'
        AND column_name = 'has_permission';

    -- If column doesn't exist or is not text, create/fix it
    IF column_type IS NULL OR column_type NOT IN ('character varying', 'text', 'varchar') THEN
        -- If table exists but column has wrong type
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_name = 'tikrar_tahfidz'
            AND table_schema = 'public'
            AND table_type = 'BASE TABLE'
        ) THEN
            -- Drop the column if it exists
            ALTER TABLE tikrar_tahfidz DROP COLUMN IF EXISTS has_permission;

            -- Add it back as text type
            ALTER TABLE tikrar_tahfidz ADD COLUMN has_permission TEXT DEFAULT '';

            RAISE NOTICE 'Recreated has_permission column as TEXT in tikrar_tahfidz';
        END IF;
    END IF;

    -- Do the same for pendaftaran_tikrar_tahfidz
    SELECT data_type INTO column_type
    FROM information_schema.columns
    WHERE table_name = 'pendaftaran_tikrar_tahfidz'
        AND table_schema = 'public'
        AND column_name = 'has_permission';

    IF column_type IS NULL OR column_type NOT IN ('character varying', 'text', 'varchar') THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_name = 'pendaftaran_tikrar_tahfidz'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE pendaftaran_tikrar_tahfidz DROP COLUMN IF EXISTS has_permission;
            ALTER TABLE pendaftaran_tikrar_tahfidz ADD COLUMN has_permission TEXT DEFAULT '';

            RAISE NOTICE 'Recreated has_permission column as TEXT in pendaftaran_tikrar_tahfidz';
        END IF;
    END IF;
END
$$;

-- Add the correct constraints
DO $$
BEGIN
    -- For tikrar_tahfidz table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'tikrar_tahfidz'
        AND table_schema = 'public'
        AND table_type = 'BASE TABLE'
    ) THEN
        ALTER TABLE tikrar_tahfidz
        ADD CONSTRAINT tikrar_tahfidz_has_permission_check CHECK (
            has_permission IN ('yes', 'janda', '')
        );
        RAISE NOTICE 'Added constraint to tikrar_tahfidz table';
    END IF;

    -- For pendaftaran_tikrar_tahfidz table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'pendaftaran_tikrar_tahfidz'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE pendaftaran_tikrar_tahfidz
        ADD CONSTRAINT pendaftaran_tikrar_tahfidz_has_permission_check CHECK (
            has_permission IN ('yes', 'janda', '')
        );
        RAISE NOTICE 'Added constraint to pendaftaran_tikrar_tahfidz table';
    END IF;
END
$$;

-- Verify the final state
SELECT
    c.table_name,
    c.column_name,
    c.data_type,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.columns c
LEFT JOIN information_schema.table_constraints tc
    ON c.table_name = tc.table_name
    AND tc.constraint_name LIKE '%has_permission%'
LEFT JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE c.table_name IN ('tikrar_tahfidz', 'pendaftaran_tikrar_tahfidz')
    AND c.table_schema = 'public'
    AND c.column_name = 'has_permission';