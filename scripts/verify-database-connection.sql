-- ============================================================================
-- Verify which Supabase database you're connected to
-- Run this in SQL Editor to identify your current database
-- ============================================================================

-- 1. Show the current database name and connection info
SELECT current_database() as database_name;

-- 2. Count key tables to verify data state
SELECT
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM batches) as total_batches,
  (SELECT COUNT(*) FROM halaqah) as total_halaqah,
  (SELECT COUNT(*) FROM halaqah WHERE status = 'active') as active_halaqah,
  (SELECT COUNT(*) FROM muallimah_registrations) as total_muallimah_regs,
  (SELECT COUNT(*) FROM muallimah_registrations WHERE status = 'approved') as approved_muallimah_regs,
  (SELECT COUNT(*) FROM pendaftaran_tikrar_tahfidz) as total_registrations;

-- 3. Show Supabase project reference (from auth schema)
SELECT
  id as project_id
FROM auth.users
LIMIT 1;

-- 4. Check if this is the same database as the API
-- You should run this query, then check if the counts match what the API returns
-- If they don't match, the API is connected to a different database
