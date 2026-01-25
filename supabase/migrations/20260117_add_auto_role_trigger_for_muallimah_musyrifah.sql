-- Migration: Auto-add muallimah/musyrifah role when registration is approved
-- Date: 2026-01-17
-- Description: Trigger to automatically add muallimah or musyrifah role when their registration is approved

-- ============================================
-- TRIGGER FOR MUALLIMAH REGISTRATIONS
-- ============================================

-- Function to handle muallimah registration status changes
CREATE OR REPLACE FUNCTION handle_muallimah_registration_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When status changes to 'approved', add muallimah role
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Add muallimah role using the existing function
    PERFORM add_user_role(NEW.user_id, 'muallimah');

    -- Log the role addition
    INSERT INTO public.system_logs (
      error_message,
      error_name,
      context,
      user_id,
      severity,
      tags
    ) VALUES (
      'Muallimah role added to user',
      'ROLE_ADDED',
      jsonb_build_object(
        'registration_id', NEW.id,
        'user_id', NEW.user_id,
        'batch_id', NEW.batch_id,
        'full_name', NEW.full_name
      ),
      NEW.user_id,
      'INFO',
      ARRAY['muallimah', 'role', 'auto_add']
    );
  END IF;

  -- When status changes from 'approved' to something else (e.g., 'rejected'), remove role
  IF OLD.status = 'approved' AND NEW.status != 'approved' THEN
    PERFORM remove_user_role(NEW.user_id, 'muallimah');

    -- Log the role removal
    INSERT INTO public.system_logs (
      error_message,
      error_name,
      context,
      user_id,
      severity,
      tags
    ) VALUES (
      'Muallimah role removed from user',
      'ROLE_REMOVED',
      jsonb_build_object(
        'registration_id', NEW.id,
        'user_id', NEW.user_id,
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      NEW.user_id,
      'INFO',
      ARRAY['muallimah', 'role', 'auto_remove']
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_muallimah_registration_role ON public.muallimah_registrations;

-- Create trigger
CREATE TRIGGER trigger_muallimah_registration_role
  AFTER UPDATE OF status ON public.muallimah_registrations
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION handle_muallimah_registration_approval();

-- ============================================
-- TRIGGER FOR MUSYRIFAH REGISTRATIONS
-- ============================================

-- Function to handle musyrifah registration status changes
CREATE OR REPLACE FUNCTION handle_musyrifah_registration_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When status changes to 'approved', add musyrifah role
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Add musyrifah role using the existing function
    PERFORM add_user_role(NEW.user_id, 'musyrifah');

    -- Log the role addition
    INSERT INTO public.system_logs (
      error_message,
      error_name,
      context,
      user_id,
      severity,
      tags
    ) VALUES (
      'Musyrifah role added to user',
      'ROLE_ADDED',
      jsonb_build_object(
        'registration_id', NEW.id,
        'user_id', NEW.user_id,
        'batch_id', NEW.batch_id,
        'full_name', NEW.full_name
      ),
      NEW.user_id,
      'INFO',
      ARRAY['musyrifah', 'role', 'auto_add']
    );
  END IF;

  -- When status changes from 'approved' to something else, remove role
  IF OLD.status = 'approved' AND NEW.status != 'approved' THEN
    PERFORM remove_user_role(NEW.user_id, 'musyrifah');

    -- Log the role removal
    INSERT INTO public.system_logs (
      error_message,
      error_name,
      context,
      user_id,
      severity,
      tags
    ) VALUES (
      'Musyrifah role removed from user',
      'ROLE_REMOVED',
      jsonb_build_object(
        'registration_id', NEW.id,
        'user_id', NEW.user_id,
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      NEW.user_id,
      'INFO',
      ARRAY['musyrifah', 'role', 'auto_remove']
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_musyrifah_registration_role ON public.musyrifah_registrations;

-- Create trigger
CREATE TRIGGER trigger_musyrifah_registration_role
  AFTER UPDATE OF status ON public.musyrifah_registrations
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION handle_musyrifah_registration_approval();

-- ============================================
-- BACKFILL: Add roles to existing approved registrations
-- ============================================

-- Add muallimah role to users with approved muallimah registrations
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT DISTINCT user_id
    FROM public.muallimah_registrations
    WHERE status = 'approved'
  LOOP
    PERFORM add_user_role(user_record.user_id, 'muallimah');
    RAISE NOTICE 'Added muallimah role to user %', user_record.user_id;
  END LOOP;
END $$;

-- Add musyrifah role to users with approved musyrifah registrations
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT DISTINCT user_id
    FROM public.musyrifah_registrations
    WHERE status = 'approved'
  LOOP
    PERFORM add_user_role(user_record.user_id, 'musyrifah');
    RAISE NOTICE 'Added musyrifah role to user %', user_record.user_id;
  END LOOP;
END $$;

-- Add comments
COMMENT ON FUNCTION handle_muallimah_registration_approval IS 'Automatically add muallimah role when registration is approved';
COMMENT ON FUNCTION handle_musyrifah_registration_approval IS 'Automatically add musyrifah role when registration is approved';
