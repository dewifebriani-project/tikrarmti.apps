-- Fix muallimah_registrations foreign key to reference public.users instead of auth.users
-- This allows proper joins between muallimah_registrations and users table

-- Drop old foreign key constraint
ALTER TABLE muallimah_registrations
DROP CONSTRAINT IF EXISTS muallimah_registrations_user_id_fkey;

-- Add new foreign key constraint to public.users
ALTER TABLE muallimah_registrations
ADD CONSTRAINT muallimah_registrations_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Do the same for reviewed_by
ALTER TABLE muallimah_registrations
DROP CONSTRAINT IF EXISTS muallimah_registrations_reviewed_by_fkey;

ALTER TABLE muallimah_registrations
ADD CONSTRAINT muallimah_registrations_reviewed_by_fkey
FOREIGN KEY (reviewed_by) REFERENCES public.users(id);

-- Do the same for musyrifah_registrations
ALTER TABLE musyrifah_registrations
DROP CONSTRAINT IF EXISTS musyrifah_registrations_user_id_fkey;

ALTER TABLE musyrifah_registrations
ADD CONSTRAINT musyrifah_registrations_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE musyrifah_registrations
DROP CONSTRAINT IF EXISTS musyrifah_registrations_reviewed_by_fkey;

ALTER TABLE musyrifah_registrations
ADD CONSTRAINT musyrifah_registrations_reviewed_by_fkey
FOREIGN KEY (reviewed_by) REFERENCES public.users(id);

-- Verify the changes
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE conrelid::regclass::text IN ('muallimah_registrations', 'musyrifah_registrations')
AND contype = 'f';
