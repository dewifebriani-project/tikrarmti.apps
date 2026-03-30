-- =====================================================
-- SYNC USER ROLES TO SUPABASE AUTH
-- =====================================================
-- This ensures that user roles from public.users are always
-- reflected in auth.users metadata for RLS policies to work.

-- Drop existing function if exists
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create function to sync roles on user creation/update
CREATE OR REPLACE FUNCTION public.sync_user_roles_to_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_roles text[];
BEGIN
  -- Get roles from public.users
  SELECT ARRAY(SELECT DISTINCT unnest(roles) ORDER BY unnest(roles))
  INTO user_roles
  FROM public.users
  WHERE id = COALESCE(NEW.id, OLD.id);

  -- Update auth.users metadata with roles
  -- Note: This requires service role privileges
  PERFORM auth.update_user(
    COALESCE(NEW.id, OLD.id),
    _user_metadata => jsonb_build_object(
      'roles', user_roles,
      'synced_at', now()
    )
  );

  RETURN COALESCE(NEW, OLD);
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to sync roles to auth for user %: %', COALESCE(NEW.id, OLD.id), SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- =====================================================
-- CREATE TRIGGER FOR ROLE SYNC
-- =====================================================

-- Drop existing triggers if any
DROP TRIGGER IF EXISTS on_user_insert_sync ON public.users;
DROP TRIGGER IF EXISTS on_user_update_sync ON public.users;

-- Create triggers
CREATE TRIGGER on_user_insert_sync
  AFTER INSERT OR UPDATE OF roles ON public.users
  FOR EACH ROW
  WHEN (NEW.roles IS DISTINCT FROM OLD.roles OR OLD.roles IS NULL)
  EXECUTE FUNCTION public.sync_user_roles_to_auth();

-- =====================================================
-- ENSURE OWNER EMAIL HAS ADMIN ROLE
-- =====================================================
-- This function checks if user's email matches owner emails
-- and grants admin role automatically

CREATE OR REPLACE FUNCTION public.ensure_owner_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_emails text[];
  current_roles text[];
BEGIN
  -- Get owner emails from environment (or set manually)
  -- In production, this should come from app settings
  owner_emails := ARRAY['dewifebriani@gmail.com']; -- Add more owner emails here

  -- Check if user email matches owner emails
  IF NEW.email = ANY(owner_emails) THEN
    -- Get current roles
    SELECT COALESCE(roles, ARRAY[]::text[])
    INTO current_roles
    FROM public.users
    WHERE id = NEW.id;

    -- Add admin role if not present
    IF NOT ('admin' = ANY(current_roles)) THEN
      NEW.roles := array_append(current_roles, 'admin');

      -- Log the automatic admin role grant
      RAISE NOTICE 'Admin role automatically granted to owner email: %', NEW.email;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for owner admin role
DROP TRIGGER IF EXISTS on_owner_user_insert ON public.users;
CREATE TRIGGER on_owner_user_insert
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_owner_admin_role();

-- =====================================================
-- MANUAL SYNC FUNCTION FOR EXISTING USERS
-- =====================================================
-- Use this to manually sync all existing users' roles to auth

CREATE OR REPLACE FUNCTION public.sync_all_users_roles_to_auth()
RETURNS TABLE(
  user_id uuid,
  email text,
  roles text[],
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_record RECORD;
  sync_count integer := 0;
BEGIN
  -- Iterate through all users with roles
  FOR user_record IN
    SELECT id, email, roles
    FROM public.users
    WHERE roles IS NOT NULL
  LOOP
    BEGIN
      -- Update auth metadata
      PERFORM auth.update_user(
        user_record.id,
        _user_metadata => jsonb_build_object(
          'roles', user_record.roles,
          'synced_at', now()
        )
      );

      sync_count := sync_count + 1;

      RETURN QUERY SELECT
        user_record.id,
        user_record.email,
        user_record.roles,
        'synced'::text;

    EXCEPTION
      WHEN OTHERS THEN
        -- Return failed status for this user
        RETURN QUERY SELECT
          user_record.id,
          user_record.email,
          user_record.roles,
          'failed: ' || SQLERRM::text;
    END;
  END LOOP;

  RAISE NOTICE 'Synced % users'' roles to auth', sync_count;
END;
$$;

-- =====================================================
-- IMMEDIATE FIX: GRANT ADMIN TO OWNER EMAIL
-- =====================================================

-- Check if owner email user exists and grant admin role
DO $$
DECLARE
  owner_email text := 'dewifebriani@gmail.com'; -- Change this to the owner email
  user_id uuid;
  current_roles text[];
BEGIN
  -- Find user by email
  SELECT id, COALESCE(roles, ARRAY[]::text[])
  INTO user_id, current_roles
  FROM public.users
  WHERE email = owner_email
  LIMIT 1;

  IF user_id IS NOT NULL THEN
    -- Check if admin role exists
    IF NOT ('admin' = ANY(current_roles)) THEN
      -- Add admin role
      UPDATE public.users
      SET
        roles = array_append(current_roles, 'admin'),
        updated_at = now()
      WHERE id = user_id;

      RAISE NOTICE 'Admin role granted to owner email %', owner_email;

      -- Sync to auth immediately
      PERFORM auth.update_user(
        user_id,
        _user_metadata => jsonb_build_object(
          'roles', array_append(current_roles, 'admin'),
          'synced_at', now()
        )
      );

      RAISE NOTICE 'Roles synced to auth for %', owner_email;
    ELSE
      RAISE NOTICE 'Owner email % already has admin role', owner_email;
    END IF;
  ELSE
    RAISE WARNING 'No user found with owner email %', owner_email;
  END IF;
END $$;

-- =====================================================
-- HELPER FUNCTION TO CHECK/SET USER ADMIN ROLE
-- =====================================================

-- Function to manually grant admin role to a user
CREATE OR REPLACE FUNCTION public.grant_admin_role(user_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  target_user_id uuid;
  current_roles text[];
  new_roles text[];
BEGIN
  -- Find user
  SELECT id, COALESCE(roles, ARRAY[]::text[])
  INTO target_user_id, current_roles
  FROM public.users
  WHERE email = user_email
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found',
      'email', user_email
    );
  END IF;

  -- Add admin role if not present
  IF 'admin' = ANY(current_roles) THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'User already has admin role',
      'email', user_email,
      'roles', current_roles
    );
  END IF;

  new_roles := array_append(current_roles, 'admin');

  -- Update public.users
  UPDATE public.users
  SET
    roles = new_roles,
    updated_at = now()
  WHERE id = target_user_id;

  -- Sync to auth
  PERFORM auth.update_user(
    target_user_id,
    _user_metadata => jsonb_build_object(
      'roles', new_roles,
      'granted_admin_at', now()
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Admin role granted',
    'email', user_email,
    'user_id', target_user_id,
    'roles', new_roles
  );
END;
$$;

-- Grant execute to service role only (security)
GRANT EXECUTE ON FUNCTION public.grant_admin_role(text) TO service_role;

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================

/*
To sync all existing users' roles to Supabase Auth:

SELECT * FROM public.sync_all_users_roles_to_auth();

To grant admin role to a specific user:

SELECT public.grant_admin_role('user@example.com');

To check a user's current roles:

SELECT id, email, roles FROM public.users WHERE email = 'user@example.com';

To manually update a user's roles:

UPDATE public.users
SET roles = ARRAY['admin', 'thalibah'],
    updated_at = now()
WHERE email = 'user@example.com';

-- Then sync to auth:
SELECT auth.update_user(
  (SELECT id FROM public.users WHERE email = 'user@example.com'),
  _user_metadata => '{"roles": ["admin", "thalibah"]}'::jsonb
);
*/
