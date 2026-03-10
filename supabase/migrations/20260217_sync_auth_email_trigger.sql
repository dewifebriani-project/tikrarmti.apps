-- Function to handle user updates from Auth
-- This function will be triggered when a user updates their email in auth.users
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update public.users email if it changed in auth.users
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.users
    SET
      email = NEW.email,
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to listen for updates on auth.users
-- Drop first to ensure idempotency
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_update();

-- One-time fix for existing users
-- Sync email from auth.users to public.users where they differ
UPDATE public.users u
SET email = au.email
FROM auth.users au
WHERE u.id = au.id
AND u.email IS DISTINCT FROM au.email;
