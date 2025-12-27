-- Migration: Add Re-enrollment Tracking for Tikrar Tahfidz
-- This migration adds fields to track when a calon thalibah completes re-enrollment
-- and transitions to becoming a full thalibah

-- Add re_enrollment tracking columns to pendaftaran_tikrar_tahfidz
ALTER TABLE public.pendaftaran_tikrar_tahfidz
  ADD COLUMN IF NOT EXISTS re_enrollment_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS re_enrollment_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS re_enrollment_confirmed_by UUID REFERENCES public.users(id);

-- Add index for faster queries on re_enrollment_completed
CREATE INDEX IF NOT EXISTS idx_pendaftaran_re_enrollment_completed
  ON public.pendaftaran_tikrar_tahfidz(re_enrollment_completed)
  WHERE re_enrollment_completed = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.re_enrollment_completed IS 'Indicates whether the calon thalibah has completed the re-enrollment process (daftar ulang) after being approved';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.re_enrollment_completed_at IS 'Timestamp when the re-enrollment was completed';
COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.re_enrollment_confirmed_by IS 'Admin user who confirmed the re-enrollment';

-- Create a function to automatically update user role to thalibah when re-enrollment is completed
CREATE OR REPLACE FUNCTION handle_re_enrollment_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if re_enrollment_completed is being set to TRUE
  IF NEW.re_enrollment_completed = TRUE AND (OLD.re_enrollment_completed IS NULL OR OLD.re_enrollment_completed = FALSE) THEN
    -- Update user role to thalibah
    UPDATE public.users
    SET role = 'thalibah',
        updated_at = NOW()
    WHERE id = NEW.user_id AND role = 'calon_thalibah';

    -- Log the role change
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (
      NEW.user_id,
      'role_change',
      'pendaftaran_tikrar_tahfidz',
      NEW.id,
      jsonb_build_object(
        'old_role', 'calon_thalibah',
        'new_role', 'thalibah',
        'reason', 'Re-enrollment completed',
        'confirmed_by', NEW.re_enrollment_confirmed_by
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically call the function
DROP TRIGGER IF EXISTS on_re_enrollment_completed ON public.pendaftaran_tikrar_tahfidz;
CREATE TRIGGER on_re_enrollment_completed
  AFTER UPDATE OF re_enrollment_completed ON public.pendaftaran_tikrar_tahfidz
  FOR EACH ROW
  EXECUTE FUNCTION handle_re_enrollment_completion();

-- Add RLS policies for the new columns
ALTER TABLE public.pendaftaran_tikrar_tahfidz ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (Supabase doesn't support IF NOT EXISTS for policies)
DROP POLICY IF EXISTS "Admins can update re_enrollment fields" ON public.pendaftaran_tikrar_tahfidz;
DROP POLICY IF EXISTS "Users can view own re_enrollment status" ON public.pendaftaran_tikrar_tahfidz;

-- Allow admins to update re_enrollment fields
CREATE POLICY "Admins can update re_enrollment fields"
  ON public.pendaftaran_tikrar_tahfidz
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Allow users to view their own re_enrollment status
CREATE POLICY "Users can view own re_enrollment status"
  ON public.pendaftaran_tikrar_tahfidz
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index on audit_logs for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
