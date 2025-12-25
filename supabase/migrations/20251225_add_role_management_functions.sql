-- Migration: Add helper functions for managing user roles
-- Date: 2025-12-25
-- Description: Functions to add, remove, and check user roles

-- Function to add a role to a user
CREATE OR REPLACE FUNCTION add_user_role(
  user_id uuid,
  new_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if role is valid
  IF new_role NOT IN ('admin', 'calon_thalibah', 'thalibah', 'muallimah', 'musyrifah', 'pengurus') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  -- Add role if not already present
  UPDATE public.users
  SET roles = array_append(roles, new_role)
  WHERE id = user_id
    AND NOT (new_role = ANY(roles));

  -- Also update the legacy role column to the most recent role for backward compatibility
  UPDATE public.users
  SET role = new_role
  WHERE id = user_id;
END;
$$;

-- Function to remove a role from a user
CREATE OR REPLACE FUNCTION remove_user_role(
  user_id uuid,
  role_to_remove text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Remove role from array
  UPDATE public.users
  SET roles = array_remove(roles, role_to_remove)
  WHERE id = user_id;
END;
$$;

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION user_has_role(
  user_id uuid,
  role_to_check text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  has_role boolean;
BEGIN
  SELECT role_to_check = ANY(roles)
  INTO has_role
  FROM public.users
  WHERE id = user_id;

  RETURN COALESCE(has_role, false);
END;
$$;

-- Function to upgrade calon_thalibah to thalibah when they pass selection
CREATE OR REPLACE FUNCTION upgrade_calon_thalibah_to_thalibah(
  user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is calon_thalibah
  IF user_has_role(user_id, 'calon_thalibah') THEN
    -- Add thalibah role
    PERFORM add_user_role(user_id, 'thalibah');
    -- Optionally remove calon_thalibah role
    -- PERFORM remove_user_role(user_id, 'calon_thalibah');
  END IF;
END;
$$;

-- Add comments
COMMENT ON FUNCTION add_user_role IS 'Add a role to a user. Validates role and prevents duplicates.';
COMMENT ON FUNCTION remove_user_role IS 'Remove a role from a user.';
COMMENT ON FUNCTION user_has_role IS 'Check if a user has a specific role.';
COMMENT ON FUNCTION upgrade_calon_thalibah_to_thalibah IS 'Upgrade calon_thalibah to thalibah role when they pass selection.';
