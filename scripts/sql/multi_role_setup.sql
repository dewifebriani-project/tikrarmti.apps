-- =====================================================
-- MULTI-ROLE SETUP FOR USERS
-- =====================================================
-- This script allows a user to have multiple roles simultaneously
-- Example: A user can be both 'thalibah' and 'muallimah' and 'admin'
-- =====================================================

-- EXAMPLE 1: Set a user as admin AND muallimah
UPDATE public.users
SET
  role = 'admin',                          -- Primary role (VARCHAR)
  roles = ARRAY['admin', 'muallimah']::text[],  -- All roles (ARRAY)
  updated_at = NOW()
WHERE email = 'user@example.com';  -- Replace with actual email

-- EXAMPLE 2: Set a user as thalibah AND muallimah AND admin
UPDATE public.users
SET
  role = 'admin',
  roles = ARRAY['admin', 'muallimah', 'thalibah']::text[],
  updated_at = NOW()
WHERE email = 'user@example.com';  -- Replace with actual email

-- EXAMPLE 3: Set ALL current admins to also be muallimah
UPDATE public.users
SET
  roles = ARRAY['admin', 'muallimah']::text[],
  updated_at = NOW()
WHERE role = 'admin'
  AND NOT (roles @> ARRAY['muallimah']::text[]);

-- =====================================================
-- QUERY TO CHECK USERS WITH MULTIPLE ROLES
-- =====================================================
SELECT
  id,
  email,
  full_name,
  role,
  roles,
  array_length(roles, 1) as role_count,
  CASE
    WHEN array_length(roles, 1) > 1 THEN 'Multi-role user'
    ELSE 'Single role user'
  END as role_type
FROM public.users
ORDER BY array_length(roles, 1) DESC NULLS LAST, created_at DESC;

-- =====================================================
-- AVAILABLE ROLES (based on database schema)
-- =====================================================
-- 'admin'      - Administrator
-- 'muallimah'  - Teacher/Ustadzah
-- 'musyrifah'  - Supervisor
-- 'thalibah'   - Student
-- 'pengurus'   - Management
-- 'calon_thalibah' - Prospective student

-- =====================================================
-- HOW TO REMOVE A ROLE FROM MULTI-ROLE USER
-- =====================================================
-- Example: Remove 'thalibah' from user who is admin+muallimah+thalibah
UPDATE public.users
SET
  roles = ARRAY['admin', 'muallimah']::text[],  -- Keep only admin and muallimah
  updated_at = NOW()
WHERE email = 'user@example.com';  -- Replace with actual email
