-- Migration: Add current_tikrar_batch_id to users table
-- Date: 2025-12-25
-- Description: Track which tikrar batch the user is currently enrolled in

-- Add column to store current tikrar batch
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS current_tikrar_batch_id uuid;

-- Add foreign key constraint (using Supabase naming convention)
ALTER TABLE public.users
ADD CONSTRAINT users_current_tikrar_batch_id_fkey
FOREIGN KEY (current_tikrar_batch_id)
REFERENCES public.batches(id)
ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_current_tikrar_batch
ON public.users(current_tikrar_batch_id);

-- Add comment
COMMENT ON COLUMN public.users.current_tikrar_batch_id IS
'Reference to the current active tikrar batch the user is enrolled in. Automatically updated when user registers or gets approved.';

-- Function to automatically set current_tikrar_batch when user is approved
CREATE OR REPLACE FUNCTION set_user_current_tikrar_batch()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if status changed to 'approved' or 'selected'
  IF (NEW.status = 'approved' OR NEW.selection_status = 'selected')
     AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.selection_status IS DISTINCT FROM NEW.selection_status) THEN

    -- Update user's current_tikrar_batch_id
    UPDATE public.users
    SET current_tikrar_batch_id = NEW.batch_id,
        updated_at = NOW()
    WHERE id = NEW.user_id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for pendaftaran_tikrar_tahfidz
DROP TRIGGER IF EXISTS trigger_set_user_tikrar_batch ON public.pendaftaran_tikrar_tahfidz;
CREATE TRIGGER trigger_set_user_tikrar_batch
AFTER UPDATE ON public.pendaftaran_tikrar_tahfidz
FOR EACH ROW
EXECUTE FUNCTION set_user_current_tikrar_batch();

-- Create view to easily get users with their current tikrar batch info
CREATE OR REPLACE VIEW v_users_with_tikrar_batch AS
SELECT
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.current_tikrar_batch_id,
  b.name as current_tikrar_batch_name,
  b.start_date as batch_start_date,
  b.end_date as batch_end_date,
  b.status as batch_status
FROM public.users u
LEFT JOIN public.batches b ON u.current_tikrar_batch_id = b.id;

COMMENT ON VIEW v_users_with_tikrar_batch IS
'View showing users with their current tikrar batch information';
