-- Simple SQL Script: Add/Update Tikrah Tahfidz MTI Batch 2 Programs (Juz 1, 28, 29, 30)
-- Date: 2025-12-23
-- Description: Create or update the three programs for Tikrah Tahfidz Batch 2
-- Usage: Run this directly in Supabase SQL Editor

-- Step 1: First, get the batch ID and store it (check the batch exists)
-- Run this query first to get your batch_id:
SELECT id, name, start_date, end_date, status
FROM batches
WHERE status = 'open' OR start_date >= '2026-01-01'
ORDER BY created_at DESC;

-- Step 2: Replace YOUR_BATCH_ID below with the actual ID from Step 1
-- Then run the following INSERT statements:

-- Program 1: Juz 1
INSERT INTO programs (id, batch_id, name, description, target_level, duration_weeks, max_thalibah, status, is_free, price)
VALUES (
    gen_random_uuid(),
    'YOUR_BATCH_ID_HERE',  -- Replace with actual batch_id from Step 1
    'Tikrah Tahfidz - Juz 1',
    'Program hafalan Juz 1 (Al-Fatihah s/d Al-Baqarah) dengan metode Tikrar 40 kali. Target hafalan 1/2 juz selama 13 pekan.',
    'Pemula',
    13,
    30,
    'open',
    true,
    0
)
ON CONFLICT (batch_id, name) DO UPDATE SET
    description = EXCLUDED.description,
    target_level = EXCLUDED.target_level,
    duration_weeks = EXCLUDED.duration_weeks,
    max_thalibah = EXCLUDED.max_thalibah,
    status = EXCLUDED.status,
    is_free = EXCLUDED.is_free,
    price = EXCLUDED.price,
    updated_at = NOW();

-- Program 2: Juz 28
INSERT INTO programs (id, batch_id, name, description, target_level, duration_weeks, max_thalibah, status, is_free, price)
VALUES (
    gen_random_uuid(),
    'YOUR_BATCH_ID_HERE',  -- Replace with actual batch_id from Step 1
    'Tikrah Tahfidz - Juz 28',
    'Program hafalan Juz 28 (An-Naba s.d. Al-Mutaffifin) dengan metode Tikrar 40 kali. Target hafalan 1/2 juz selama 13 pekan.',
    'Menengah',
    13,
    30,
    'open',
    true,
    0
)
ON CONFLICT (batch_id, name) DO UPDATE SET
    description = EXCLUDED.description,
    target_level = EXCLUDED.target_level,
    duration_weeks = EXCLUDED.duration_weeks,
    max_thalibah = EXCLUDED.max_thalibah,
    status = EXCLUDED.status,
    is_free = EXCLUDED.is_free,
    price = EXCLUDED.price,
    updated_at = NOW();

-- Program 3: Juz 29
INSERT INTO programs (id, batch_id, name, description, target_level, duration_weeks, max_thalibah, status, is_free, price)
VALUES (
    gen_random_uuid(),
    'YOUR_BATCH_ID_HERE',  -- Replace with actual batch_id from Step 1
    'Tikrah Tahfidz - Juz 29',
    'Program hafalan Juz 29 (Al-Mulk s.d. An-Naba) dengan metode Tikrar 40 kali. Target hafalan 1/2 juz selama 13 pekan.',
    'Menengah',
    13,
    30,
    'open',
    true,
    0
)
ON CONFLICT (batch_id, name) DO UPDATE SET
    description = EXCLUDED.description,
    target_level = EXCLUDED.target_level,
    duration_weeks = EXCLUDED.duration_weeks,
    max_thalibah = EXCLUDED.max_thalibah,
    status = EXCLUDED.status,
    is_free = EXCLUDED.is_free,
    price = EXCLUDED.price,
    updated_at = NOW();

-- Program 4: Juz 30
INSERT INTO programs (id, batch_id, name, description, target_level, duration_weeks, max_thalibah, status, is_free, price)
VALUES (
    gen_random_uuid(),
    'YOUR_BATCH_ID_HERE',  -- Replace with actual batch_id from Step 1
    'Tikrah Tahfidz - Juz 30',
    'Program hafalan Juz 30 (An-Naba s.d. An-Nas) dengan metode Tikrar 40 kali. Target hafalan 1/2 juz selama 13 pekan. Program juz terakhir yang menjadi kunci mutqin.',
    'Lanjutan',
    13,
    30,
    'open',
    true,
    0
)
ON CONFLICT (batch_id, name) DO UPDATE SET
    description = EXCLUDED.description,
    target_level = EXCLUDED.target_level,
    duration_weeks = EXCLUDED.duration_weeks,
    max_thalibah = EXCLUDED.max_thalibah,
    status = EXCLUDED.status,
    is_free = EXCLUDED.is_free,
    price = EXCLUDED.price,
    updated_at = NOW();

-- Step 3: Verify the programs were created
SELECT
    p.id,
    p.name,
    p.description,
    p.target_level,
    p.duration_weeks,
    p.max_thalibah,
    p.status,
    p.is_free,
    p.price,
    b.name as batch_name,
    b.start_date,
    b.end_date
FROM programs p
JOIN batches b ON p.batch_id = b.id
WHERE p.name ILIKE '%Tikrah Tahfidz - Juz%'
ORDER BY p.name;
