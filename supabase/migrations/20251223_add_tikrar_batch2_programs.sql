-- Migration: Add/Update Tikrah Tahfidz MTI Batch 2 Programs (Juz 1, 28, 29, 30)
-- Date: 2025-12-23
-- Description: Create or update the three programs for Tikrah Tahfidz Batch 2

-- First, get the active batch ID for Batch 2 (2026)
-- We'll use a variable to store the batch ID
DO $$
DECLARE
    v_batch_id UUID;
    v_program_1_id UUID;
    v_program_28_id UUID;
    v_program_29_id UUID;
    v_program_30_id UUID;
BEGIN
    -- Get the active batch ID (Batch 2026)
    SELECT id INTO v_batch_id
    FROM batches
    WHERE name ILIKE '%2026%' OR (start_date >= '2026-01-01' AND status = 'open')
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_batch_id IS NULL THEN
        RAISE EXCEPTION 'Batch 2026 not found. Please create the batch first.';
    END IF;

    -- Create or update Program for Juz 1
    INSERT INTO programs (id, batch_id, name, description, target_level, duration_weeks, max_thalibah, status, is_free, price)
    VALUES (
        gen_random_uuid(),
        v_batch_id,
        'Tikrah Tahfidz - Juz 1',
        'Program hafalan Juz 1 (Al-Fatihah s/d Al-Baqarah) dengan metode Tikrar 40 kali. Target hafalan 1/2 juz selama 13 pekan.',
        'Pemula',
        13,
        30,
        'open',
        true,
        0
    )
    ON CONFLICT (batch_id, name)
    DO UPDATE SET
        description = EXCLUDED.description,
        target_level = EXCLUDED.target_level,
        duration_weeks = EXCLUDED.duration_weeks,
        max_thalibah = EXCLUDED.max_thalibah,
        status = EXCLUDED.status,
        is_free = EXCLUDED.is_free,
        price = EXCLUDED.price,
        updated_at = NOW()
    RETURNING id INTO v_program_1_id;

    -- Create or update Program for Juz 28
    INSERT INTO programs (id, batch_id, name, description, target_level, duration_weeks, max_thalibah, status, is_free, price)
    VALUES (
        gen_random_uuid(),
        v_batch_id,
        'Tikrah Tahfidz - Juz 28',
        'Program hafalan Juz 28 (An-Naba s.d. Al-Mutaffifin) dengan metode Tikrar 40 kali. Target hafalan 1/2 juz selama 13 pekan.',
        'Menengah',
        13,
        30,
        'open',
        true,
        0
    )
    ON CONFLICT (batch_id, name)
    DO UPDATE SET
        description = EXCLUDED.description,
        target_level = EXCLUDED.target_level,
        duration_weeks = EXCLUDED.duration_weeks,
        max_thalibah = EXCLUDED.max_thalibah,
        status = EXCLUDED.status,
        is_free = EXCLUDED.is_free,
        price = EXCLUDED.price,
        updated_at = NOW()
    RETURNING id INTO v_program_28_id;

    -- Create or update Program for Juz 29
    INSERT INTO programs (id, batch_id, name, description, target_level, duration_weeks, max_thalibah, status, is_free, price)
    VALUES (
        gen_random_uuid(),
        v_batch_id,
        'Tikrah Tahfidz - Juz 29',
        'Program hafalan Juz 29 (Al-Mulk s.d. An-Naba) dengan metode Tikrar 40 kali. Target hafalan 1/2 juz selama 13 pekan.',
        'Menengah',
        13,
        30,
        'open',
        true,
        0
    )
    ON CONFLICT (batch_id, name)
    DO UPDATE SET
        description = EXCLUDED.description,
        target_level = EXCLUDED.target_level,
        duration_weeks = EXCLUDED.duration_weeks,
        max_thalibah = EXCLUDED.max_thalibah,
        status = EXCLUDED.status,
        is_free = EXCLUDED.is_free,
        price = EXCLUDED.price,
        updated_at = NOW()
    RETURNING id INTO v_program_29_id;

    -- Create or update Program for Juz 30
    INSERT INTO programs (id, batch_id, name, description, target_level, duration_weeks, max_thalibah, status, is_free, price)
    VALUES (
        gen_random_uuid(),
        v_batch_id,
        'Tikrah Tahfidz - Juz 30',
        'Program hafalan Juz 30 (An-Naba s.d. An-Nas) dengan metode Tikrar 40 kali. Target hafalan 1/2 juz selama 13 pekan. Program juz terakhir yang menjadi kunci mutqin.',
        'Lanjutan',
        13,
        30,
        'open',
        true,
        0
    )
    ON CONFLICT (batch_id, name)
    DO UPDATE SET
        description = EXCLUDED.description,
        target_level = EXCLUDED.target_level,
        duration_weeks = EXCLUDED.duration_weeks,
        max_thalibah = EXCLUDED.max_thalibah,
        status = EXCLUDED.status,
        is_free = EXCLUDED.is_free,
        price = EXCLUDED.price,
        updated_at = NOW()
    RETURNING id INTO v_program_30_id;

    RAISE NOTICE 'Programs created/updated successfully for batch: %', v_batch_id;
END $$;

-- Add comments for documentation
COMMENT ON TABLE programs IS 'Table program untuk setiap batch, berisi detail program seperti Tikrah Tahfidz, Muallimah, dll';

-- Verify the programs
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

-- Expected output should show 4 programs:
-- 1. Tikrah Tahfidz - Juz 1
-- 2. Tikrah Tahfidz - Juz 28
-- 3. Tikrah Tahfidz - Juz 29
-- 4. Tikrah Tahfidz - Juz 30
