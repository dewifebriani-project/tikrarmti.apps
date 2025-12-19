-- ===================================================================
-- CHECK IF NAMA_KUNYAH COLUMN EXISTS
-- ===================================================================
-- Run this in Supabase SQL Editor to check if the column exists
-- ===================================================================

-- Check if column exists in users table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name = 'nama_kunyah';

-- If the query above returns 1 row, the column EXISTS ✓
-- If the query above returns 0 rows, the column DOES NOT EXIST ✗
-- In that case, run ADD_NAMA_KUNYAH_COLUMN.sql

-- ===================================================================
-- Show all columns in users table (to see the full structure)
-- ===================================================================
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;
