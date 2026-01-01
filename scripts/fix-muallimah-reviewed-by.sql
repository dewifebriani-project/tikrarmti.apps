-- Fix existing muallimah_registrations data
-- This script fixes reviewed_by values that reference auth.users instead of public.users

-- Check for problematic records
SELECT
    mr.id,
    mr.reviewed_by,
    u.id as public_user_id,
    u.email,
    mr.status
FROM muallimah_registrations mr
LEFT JOIN public.users u ON mr.reviewed_by = u.id
WHERE mr.reviewed_by IS NOT NULL
AND u.id IS NULL; -- These are problematic records

-- Fix: Set reviewed_by to NULL for records where the reviewer doesn't exist in public.users
-- OR update to match the correct public.users.id based on auth.users.id

-- Option 1: Simply set to NULL for now (safer)
UPDATE muallimah_registrations
SET reviewed_by = NULL
WHERE reviewed_by IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = muallimah_registrations.reviewed_by
);

-- Option 2: If the UUIDs match between auth.users and public.users, no action needed
-- But if there are mismatches, we need to map them correctly

-- Verify fix
SELECT COUNT(*) as fixed_records
FROM muallimah_registrations
WHERE reviewed_by IS NULL;

-- Do the same for musyrifah_registrations
UPDATE musyrifah_registrations
SET reviewed_by = NULL
WHERE reviewed_by IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = musyrifah_registrations.reviewed_by
);
