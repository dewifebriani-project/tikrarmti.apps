-- =====================================================
-- Migrate Data from tikrar_tahfidz to pendaftaran_tikrar_tahfidz
-- =====================================================
-- WARNING: This script will move ALL data from tikrar_tahfidz to pendaftaran_tikrar_tahfidz
-- Make sure to backup your data before running this!

-- Check if both tables exist
DO $$
DECLARE
    source_exists BOOLEAN;
    target_exists BOOLEAN;
    row_count INTEGER;
BEGIN
    -- Check if source table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'tikrar_tahfidz'
        AND table_schema = 'public'
        AND table_type = 'BASE TABLE'
    ) INTO source_exists;

    -- Check if target table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'pendaftaran_tikrar_tahfidz'
        AND table_schema = 'public'
        AND table_type = 'BASE TABLE'
    ) INTO target_exists;

    IF NOT source_exists THEN
        RAISE EXCEPTION 'Source table tikrar_tahfidz does not exist';
    END IF;

    IF NOT target_exists THEN
        RAISE EXCEPTION 'Target table pendaftaran_tikrar_tahfidz does not exist. Please run fix_tikrar_table_safe.sql first';
    END IF;

    -- Check row count in source table
    SELECT COUNT(*) INTO row_count FROM public.tikrar_tahfidz;

    RAISE NOTICE 'Found % rows in tikrar_tahfidz table', row_count;

    IF row_count = 0 THEN
        RAISE NOTICE 'No data to migrate';
    ELSE
        RAISE NOTICE 'Ready to migrate % rows from tikrar_tahfidz to pendaftaran_tikrar_tahfidz', row_count;
    END IF;
END
$$;

-- Show sample data before migration
SELECT 'Sample data from tikrar_tahfidz (before migration):' as info;
SELECT
    id,
    user_id,
    full_name,
    created_at,
    status
FROM public.tikrar_tahfidz
LIMIT 5;

-- Uncomment the line below to actually migrate data (after reviewing above)
-- INSERT INTO public.pendaftaran_tikrar_tahfidz SELECT * FROM public.tikrar_tahfidz;

-- Check results after migration (run this after uncommenting the INSERT above)
-- SELECT
--     'Data in pendaftaran_tikrar_tahfidz (after migration):' as info,
--     COUNT(*) as total_rows
-- FROM public.pendaftaran_tikrar_tahfidz;

-- SELECT
--     id,
--     user_id,
--     full_name,
--     created_at,
--     status
-- FROM public.pendaftaran_tikrar_tahfidz
-- LIMIT 5;