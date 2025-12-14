-- UPDATE BATCH NAME IN pendaftaran_tikrar_tahfidz TABLE
-- This script updates batch_name to match the new batch name

-- IMPORTANT: Run this in Supabase SQL Editor

BEGIN;

-- First, let's see what batch_name values currently exist
SELECT DISTINCT batch_name, COUNT(*) as count
FROM pendaftaran_tikrar_tahfidz
GROUP BY batch_name
ORDER BY batch_name;

-- Update batch_name to "Tikrar Tahfidz MTI Batch 2" for Batch 2 records
-- Assuming the old name was something like "Batch 2" or similar

-- Option 1: Update all records with batch_id that matches Batch 2
UPDATE pendaftaran_tikrar_tahfidz
SET batch_name = 'Tikrar Tahfidz MTI Batch 2'
WHERE batch_id = (
  SELECT id FROM batches
  WHERE name = 'Tikrar Tahfidz MTI Batch 2'
  OR name LIKE '%Batch 2%'
  LIMIT 1
);

-- Option 2: Update by old batch_name pattern (if batch_name column exists)
UPDATE pendaftaran_tikrar_tahfidz
SET batch_name = 'Tikrar Tahfidz MTI Batch 2'
WHERE batch_name LIKE '%Batch 2%'
  OR batch_name LIKE '%batch 2%'
  OR batch_name = 'Batch 2';

-- Option 3: Sync ALL batch_name from batches table (RECOMMENDED)
-- This ensures batch_name always matches the current name in batches table
UPDATE pendaftaran_tikrar_tahfidz pt
SET batch_name = b.name
FROM batches b
WHERE pt.batch_id = b.id;

-- Verify the changes
SELECT
  pt.id,
  pt.batch_name,
  b.name as current_batch_name,
  pt.full_name,
  pt.status
FROM pendaftaran_tikrar_tahfidz pt
LEFT JOIN batches b ON pt.batch_id = b.id
ORDER BY pt.created_at DESC
LIMIT 20;

COMMIT;

-- Summary of changes
SELECT
  batch_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count
FROM pendaftaran_tikrar_tahfidz
GROUP BY batch_name
ORDER BY batch_name;
