-- Migration: Fix users_roles_check constraint
-- Date: 2026-06-03
-- Description: Drop problematic users_roles_check constraint and ensure check_valid_roles is correct

-- Drop the constraints if they exist to start fresh
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_roles_check;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS check_valid_roles;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Create a robust check constraint for the 'roles' array
ALTER TABLE public.users
ADD CONSTRAINT check_valid_roles
CHECK (
  roles IS NULL OR roles <@ ARRAY[
    'admin',
    'calon_thalibah',
    'thalibah',
    'muallimah',
    'musyrifah',
    'pengurus'
  ]::text[]
);

-- Note: The legacy 'role' column is no longer strictly checked via constraint here 
-- to prevent blocking updates during transition. The add_user_role function already 
-- prevents invalid roles from being inserted.
