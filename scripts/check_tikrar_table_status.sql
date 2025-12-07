-- =====================================================
-- Check Tikrar Table Status
-- =====================================================

-- Check which tables exist
SELECT
    table_name,
    table_type,
    table_schema
FROM information_schema.tables
WHERE table_name IN ('tikrar_tahfidz', 'pendaftaran_tikrar_tahfidz')
AND table_schema = 'public'
ORDER BY table_name;

-- Check if view exists
SELECT
    table_name,
    table_type
FROM information_schema.views
WHERE table_name = 'tikrar_tahfidz'
AND table_schema = 'public';

-- Check foreign key constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name IN ('tikrar_tahfidz', 'pendaftaran_tikrar_tahfidz')
AND tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public';