-- ============================================================================
-- Migration: Check and Fix Batch Statuses
-- Date: 2026-01-03
-- Description: Check current batch statuses and update if needed for halaqah creation
-- ============================================================================

-- First, check all batches and their statuses
SELECT
    id,
    name,
    status,
    start_date,
    end_date,
    registration_start_date,
    registration_end_date
FROM batches
ORDER BY created_at DESC;

-- If there are batches with status that should be 'open' but aren't,
-- uncomment and run the appropriate UPDATE statements below:

-- Example: Update a specific batch to 'open' status
-- UPDATE batches
-- SET status = 'open'
-- WHERE id = 'YOUR_BATCH_ID_HERE';

-- Example: Update all batches that are upcoming to 'open' status
-- UPDATE batches
-- SET status = 'open'
-- WHERE start_date >= CURRENT_DATE
-- AND status IN ('draft', 'closed');

-- Example: Show batches that should probably be 'open'
SELECT
    id,
    name,
    status,
    start_date,
    end_date,
    registration_start_date,
    registration_end_date,
    CASE
        WHEN start_date >= CURRENT_DATE AND status IN ('draft', 'closed') THEN 'Should be OPEN'
        WHEN start_date < CURRENT_DATE AND end_date >= CURRENT_DATE AND status = 'open' THEN 'Correctly OPEN'
        WHEN end_date < CURRENT_DATE AND status = 'open' THEN 'Should be CLOSED'
        ELSE 'Status OK'
    END as recommendation
FROM batches
ORDER BY created_at DESC;
