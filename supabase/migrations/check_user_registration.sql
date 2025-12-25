-- Check if logged-in user has registration record
-- Run this while logged in to see if your user has a pendaftaran record

SELECT
    id,
    user_id,
    email,
    full_name,
    status,
    oral_submission_url,
    oral_submission_file_name,
    oral_submitted_at,
    created_at,
    updated_at
FROM public.pendaftaran_tikrar_tahfidz
WHERE user_id = auth.uid();

-- If this returns no rows, user needs to create registration first
-- If it returns a row with status='approved', user can test oral submission upload
