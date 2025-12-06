-- Insert Batch 2 Tikrar MTI data
-- Run this in Supabase SQL Editor

-- First, let's check if Batch 2 already exists
SELECT * FROM public.batches WHERE name ILIKE '%batch 2%' OR name ILIKE '%Tikrar MTI Batch 2%';

-- Insert Batch 2 data if it doesn't exist
INSERT INTO public.batches (
    name,
    description,
    program_type,
    start_date,
    end_date,
    registration_start_date,
    registration_end_date,
    duration_weeks,
    status,
    is_free,
    price,
    total_quota,
    registered_count,
    created_at,
    updated_at
) VALUES (
    'Tikrar MTI Batch 2',
    'Program intensif Tikrar Tahfidz Al-Quran dengan metode MTI yang telah terbukti efektif. Dikelola oleh Markaz Tikrar Indonesia.',
    'tikrar_tahfidz',
    '2025-01-15',
    '2025-04-15',
    '2024-12-06',
    '2025-01-10',
    13, -- 13 weeks duration
    'open', -- Open for registration
    true, -- Free program
    0, -- Price (0 because it's free)
    100, -- Total quota
    0, -- Initial registered count (will be updated automatically)
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Verify the insertion
SELECT * FROM public.batches WHERE name = 'Tikrar MTI Batch 2';

-- Note: The registered_count will be automatically updated when users register for the program
-- through the registration system. You can manually update it with:
-- UPDATE public.batches SET registered_count = <actual_count> WHERE name = 'Tikrar MTI Batch 2';