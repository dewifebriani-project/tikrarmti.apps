-- Migration: Auto-upgrade calon_thalibah to thalibah when daftar ulang is approved
-- Date: 2026-01-17
-- Description: Trigger to automatically upgrade calon_thalibah to thalibah when daftar ulang submission is approved

-- ============================================
-- TRIGGER FOR DAFTAR ULANG APPROVAL
-- ============================================

-- Function to handle daftar ulang submission status changes
CREATE OR REPLACE FUNCTION handle_daftar_ulang_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When status changes to 'approved', upgrade user role
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Remove 'calon_thalibah' and add 'thalibah' role
    -- Using the existing add_user_role and remove_user_role functions
    PERFORM remove_user_role(NEW.user_id, 'calon_thalibah');
    PERFORM add_user_role(NEW.user_id, 'thalibah');

    -- Log the role change
    INSERT INTO public.system_logs (
      error_message,
      error_name,
      context,
      user_id,
      severity,
      tags
    ) VALUES (
      'User upgraded from calon_thalibah to thalibah',
      'ROLE_UPGRADE',
      jsonb_build_object(
        'submission_id', NEW.id,
        'user_id', NEW.user_id,
        'batch_id', NEW.batch_id,
        'registration_id', NEW.registration_id,
        'old_role', 'calon_thalibah',
        'new_role', 'thalibah'
      ),
      NEW.user_id,
      'INFO',
      ARRAY['thalibah', 'role', 'auto_upgrade', 'daftar_ulang']
    );
  END IF;

  -- When status changes from 'approved' back to something else, downgrade role
  IF OLD.status = 'approved' AND NEW.status != 'approved' THEN
    -- Remove 'thalibah' and add back 'calon_thalibah' role
    PERFORM remove_user_role(NEW.user_id, 'thalibah');
    PERFORM add_user_role(NEW.user_id, 'calon_thalibah');

    -- Log the role change
    INSERT INTO public.system_logs (
      error_message,
      error_name,
      context,
      user_id,
      severity,
      tags
    ) VALUES (
      'User downgraded from thalibah to calon_thalibah',
      'ROLE_DOWNGRADE',
      jsonb_build_object(
        'submission_id', NEW.id,
        'user_id', NEW.user_id,
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      NEW.user_id,
      'WARN',
      ARRAY['thalibah', 'role', 'auto_downgrade', 'daftar_ulang']
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_daftar_ulang_approval_role ON public.daftar_ulang_submissions;

-- Create trigger
CREATE TRIGGER trigger_daftar_ulang_approval_role
  AFTER UPDATE OF status ON public.daftar_ulang_submissions
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION handle_daftar_ulang_approval();

-- ============================================
-- BACKFILL: Upgrade existing approved submissions
-- ============================================

-- Upgrade users with approved daftar ulang submissions
DO $$
DECLARE
  submission_record RECORD;
  user_roles text[];
BEGIN
  FOR submission_record IN
    SELECT DISTINCT user_id
    FROM public.daftar_ulang_submissions
    WHERE status = 'approved'
  LOOP
    -- Get current roles
    SELECT roles INTO user_roles
    FROM public.users
    WHERE id = submission_record.user_id;

    -- Remove calon_thalibah and add thalibah if not already present
    IF user_roles IS NOT NULL THEN
      user_roles := array_remove(user_roles, 'calon_thalibah');
      IF NOT (user_roles @> ARRAY['thalibah']::text[]) THEN
        user_roles := array_append(user_roles, 'thalibah');
      END IF;

      -- Update user roles
      UPDATE public.users
      SET roles = user_roles
      WHERE id = submission_record.user_id;

      RAISE NOTICE 'Upgraded user % from calon_thalibah to thalibah', submission_record.user_id;
    END IF;
  END LOOP;
END $$;

-- Add comments
COMMENT ON FUNCTION handle_daftar_ulang_approval IS 'Automatically upgrade calon_thalibah to thalibah when daftar ulang is approved';
