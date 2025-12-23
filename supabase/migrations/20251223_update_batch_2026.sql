-- Migration to update batch for 2026
-- Start date: 5 Januari 2026
-- Duration: 13 pekan
-- End date: 7 April 2026 (13 weeks from start)

-- Update existing batch or create new one
INSERT INTO batches (id, name, description, start_date, end_date, registration_start_date, registration_end_date, status, duration_weeks, program_type, total_quota, registered_count)
VALUES (
    gen_random_uuid(),
    'Batch 2026 - Tikrar MTI',
    'Batch program Tikrar Tahfidz MTI tahun 2026',
    '2026-01-05',
    '2026-04-07',
    '2025-12-20',
    '2026-01-04',
    'open',
    13,
    'tikrah',
    100,
    0
) ON CONFLICT DO NOTHING;

-- Update existing batch if it exists
UPDATE batches
SET
    name = 'Batch 2026 - Tikrar MTI',
    description = 'Batch program Tikrar Tahfidz MTI tahun 2026',
    start_date = '2026-01-05',
    end_date = '2026-04-07',
    registration_start_date = '2025-12-20',
    registration_end_date = '2026-01-04',
    status = 'open',
    duration_weeks = 13,
    program_type = 'tikrah',
    total_quota = 100,
    registered_count = 0,
    updated_at = NOW()
WHERE status = 'open' OR name LIKE '%2025%';

-- Close old batches
UPDATE batches
SET status = 'closed', updated_at = NOW()
WHERE start_date < '2026-01-01' AND status != 'closed';
