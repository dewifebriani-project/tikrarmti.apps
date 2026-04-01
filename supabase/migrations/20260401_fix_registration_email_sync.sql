-- ============================================================================
-- Migration: Fix Registration Data Persistence (Email Sync Trigger)
-- Date: 2026-04-01
-- Description: Ensures email changes in auth.users are propagated to ALL related
--              tables (users, registrations) and fixes orphaned records.
-- ============================================================================

-- 1. IMPROVE USER UPDATE TRIGGER
-- This function handles propagating email changes from auth.users to public tables.
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the event for debugging
  RAISE NOTICE 'Syncing email change for user_id: %, from % to %', NEW.id, OLD.email, NEW.email;

  -- Update public.users
  UPDATE public.users
  SET 
    email = NEW.email,
    updated_at = NOW()
  WHERE id = NEW.id;

  -- Update registration tables (cascading email change)
  -- This ensures dashboard data remains visible after an email change
  UPDATE public.pendaftaran_tikrar_tahfidz
  SET 
    email = NEW.email,
    updated_at = NOW()
  WHERE user_id = NEW.id;

  UPDATE public.muallimah_registrations
  SET 
    email = NEW.email,
    updated_at = NOW()
  WHERE user_id = NEW.id;

  UPDATE public.musyrifah_registrations
  SET 
    email = NEW.email,
    updated_at = NOW()
  WHERE user_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger is active
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_update();

-- 2. ONE-TIME HEALING: Link orphaned registrations to user_id by email
-- This fixes historical mismatches where user_id was NULL or wrong
DO $$
DECLARE
  u record;
BEGIN
  -- Loop through all auth users
  FOR u IN SELECT id, email FROM auth.users LOOP
    -- Link registrations that match by email but don't have this user_id
    UPDATE public.pendaftaran_tikrar_tahfidz
    SET user_id = u.id
    WHERE (email = u.email OR wa_phone = u.email) -- handle the legacy wa_phone=email issue
      AND (user_id IS NULL OR user_id != u.id);
      
    -- Also sync the email column just in case it was mismatching
    UPDATE public.pendaftaran_tikrar_tahfidz
    SET email = u.email
    WHERE user_id = u.id AND (email IS NULL OR email != u.email);
  END LOOP;
END;
$$;

-- 3. VERIFY CONSISTENCY
-- Check for any remaining registrations with mismatching user_id/email
-- (This is just a comment for admin reference)
-- SELECT pt.id, pt.user_id, pt.email as reg_email, au.email as auth_email
-- FROM public.pendaftaran_tikrar_tahfidz pt
-- JOIN auth.users au ON pt.user_id = au.id
-- WHERE pt.email != au.email;
