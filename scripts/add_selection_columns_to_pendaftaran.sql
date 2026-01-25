-- Copy this SQL and run in Supabase Dashboard -> SQL Editor

-- Add selection tracking columns to pendaftaran_tikrar_tahfidz table
ALTER TABLE pendaftaran_tikrar_tahfidz
ADD COLUMN IF NOT EXISTS oral_submission_url TEXT,
ADD COLUMN IF NOT EXISTS oral_submission_file_name TEXT,
ADD COLUMN IF NOT EXISTS oral_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS written_quiz_answers JSONB,
ADD COLUMN IF NOT EXISTS written_quiz_score INTEGER,
ADD COLUMN IF NOT EXISTS written_quiz_total_questions INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS written_quiz_correct_answers INTEGER,
ADD COLUMN IF NOT EXISTS written_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS selection_completed_at TIMESTAMP WITH TIME ZONE;

-- Add index for new columns
CREATE INDEX IF NOT EXISTS idx_pendaftaran_oral_submitted_at ON pendaftaran_tikrar_tahfidz(oral_submitted_at);
CREATE INDEX IF NOT EXISTS idx_pendaftaran_written_submitted_at ON pendaftaran_tikrar_tahfidz(written_submitted_at);

-- Update selection_status check constraint to include new values
ALTER TABLE pendaftaran_tikrar_tahfidz
DROP CONSTRAINT IF EXISTS pendaftaran_tikrar_tahfidz_selection_status_check;

ALTER TABLE pendaftaran_tikrar_tahfidz
ADD CONSTRAINT pendaftaran_tikrar_tahfidz_selection_status_check
CHECK (
  (
    (selection_status)::text = any (
      (
        array[
          'pending'::character varying,
          'in_progress'::character varying,
          'completed'::character varying,
          'approved'::character varying,
          'rejected'::character varying,
          'waitlist'::character varying
        ]
      )::text[]
    )
  )
);

-- Create function to check if both selections are completed
CREATE OR REPLACE FUNCTION check_selection_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if both oral and written selections are submitted
  IF NEW.oral_submission_url IS NOT NULL AND NEW.written_quiz_answers IS NOT NULL THEN
    NEW.selection_completed_at = NOW();
    -- Update selection_status to completed if both are submitted
    IF NEW.selection_status = 'pending' OR NEW.selection_status = 'in_progress' THEN
      NEW.selection_status = 'completed';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update completion status
DROP TRIGGER IF EXISTS check_selection_completion_trigger ON pendaftaran_tikrar_tahfidz;
CREATE TRIGGER check_selection_completion_trigger
  BEFORE UPDATE ON pendaftaran_tikrar_tahfidz
  FOR EACH ROW
  EXECUTE FUNCTION check_selection_completion();

-- Comment: This eliminates the need for a separate selection_submissions table
-- All selection data is now tracked within the main pendaftaran_tikrar_tahfidz table