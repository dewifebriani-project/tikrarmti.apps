-- Fix database constraints untuk role 'calon_thalibah'

-- Drop existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint that includes 'calon_thalibah'
ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('admin', 'musyrifah', 'muallimah', 'calon_thalibah', 'thalibah'));

-- Verify constraint was updated
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
AND conname = 'users_role_check';