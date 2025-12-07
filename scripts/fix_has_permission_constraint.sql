-- Fix the has_permission constraint to allow proper string values
-- First, drop the existing constraint if it exists
DO $$
BEGIN
    -- Check if constraint exists on pendaftaran_tikrar_tahfidz table
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'pendaftaran_tikrar_tahfidz_has_permission_check'
    ) THEN
        ALTER TABLE pendaftaran_tikrar_tahfidz
        DROP CONSTRAINT pendaftaran_tikrar_tahfidz_has_permission_check;
        RAISE NOTICE 'Dropped constraint: pendaftaran_tikrar_tahfidz_has_permission_check';
    END IF;

    -- Also check if it exists on tikrar_tahfidz table (in case that's the actual table name)
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'tikrar_tahfidz_has_permission_check'
    ) THEN
        ALTER TABLE tikrar_tahfidz
        DROP CONSTRAINT tikrar_tahfidz_has_permission_check;
        RAISE NOTICE 'Dropped constraint: tikrar_tahfidz_has_permission_check';
    END IF;
END
$$;

-- Add the correct check constraint for has_permission field
DO $$
BEGIN
    -- Add constraint to pendaftaran_tikrar_tahfidz table
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

    -- Add constraint to tikrar_tahfidz table if it exists
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
END
$$;

-- Verify the constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.table_name IN ('pendaftaran_tikrar_tahfidz', 'tikrar_tahfidz')
    AND tc.constraint_type = 'CHECK'
    AND cc.check_clause LIKE '%has_permission%';