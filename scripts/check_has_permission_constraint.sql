-- Check existing constraints on pendaftaran_tikrar_tahfidz table
SELECT
    tc.constraint_name,
    tc.constraint_type,
    tc.check_clause,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'pendaftaran_tikrar_tahfidz'
    AND tc.table_schema = 'public'
    AND tc.constraint_type = 'CHECK'
    AND kcu.column_name = 'has_permission';

-- Check if table actually uses the name tikrar_tahfidz instead
SELECT
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'tikrar_tahfidz'
    AND tc.table_schema = 'public'
    AND tc.constraint_type = 'CHECK'
    AND kcu.column_name = 'has_permission';