-- Migration: Convert users.role from varchar to text[] to support multiple roles
-- Date: 2025-12-25
-- Description: Users can have multiple roles (e.g., calon_thalibah, thalibah, muallimah, musyrifah, admin)

-- Step 1: Add new column roles as text array
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS roles text[];

-- Step 2: Migrate existing role data to roles array
-- If role is NULL or empty, set roles to empty array
-- Otherwise, convert single role to array
UPDATE public.users
SET roles = CASE
  WHEN role IS NULL OR role = '' THEN ARRAY[]::text[]
  ELSE ARRAY[role]::text[]
END
WHERE roles IS NULL;

-- Step 3: Create index on roles array for better query performance
CREATE INDEX IF NOT EXISTS idx_users_roles ON public.users USING GIN(roles);

-- Step 4: Add check constraint to ensure valid roles
ALTER TABLE public.users
ADD CONSTRAINT check_valid_roles
CHECK (
  roles <@ ARRAY[
    'admin',
    'calon_thalibah',
    'thalibah',
    'muallimah',
    'musyrifah',
    'pengurus'
  ]::text[]
);

-- Note: We keep the old 'role' column for backward compatibility
-- Applications should gradually migrate to use 'roles' array instead
-- Once all applications are updated, we can drop the 'role' column with:
-- ALTER TABLE public.users DROP COLUMN role;

-- Add comment to the new column
COMMENT ON COLUMN public.users.roles IS 'Array of roles assigned to the user. A user can have multiple roles (e.g., [calon_thalibah, muallimah])';
COMMENT ON COLUMN public.users.role IS 'DEPRECATED: Use roles array instead. Kept for backward compatibility.';
