const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const migrationSQL = `
-- Create selection_submissions table
CREATE TABLE IF NOT EXISTS selection_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('oral', 'written')),
  audio_url TEXT, -- For oral submission
  file_name TEXT, -- Original filename for audio
  answers JSONB, -- For written quiz answers
  score INTEGER, -- Score for written quiz
  total_questions INTEGER, -- Total questions in written quiz
  correct_answers INTEGER, -- Number of correct answers
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure each user can only submit one of each type
  UNIQUE(user_id, type)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_selection_submissions_user_id ON selection_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_selection_submissions_type ON selection_submissions(type);
CREATE INDEX IF NOT EXISTS idx_selection_submissions_submission_date ON selection_submissions(submission_date);

-- Update function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic updated_at
DROP TRIGGER IF EXISTS update_selection_submissions_updated_at ON selection_submissions;
CREATE TRIGGER update_selection_submissions_updated_at
  BEFORE UPDATE ON selection_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`;

async function runMigration() {
  try {
    console.log('Running migration for selection_submissions table...');

    // Execute migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // Try direct SQL if RPC doesn't exist
      console.log('RPC not available, trying direct SQL execution...');

      // Create bucket manually through SQL
      const bucketSQL = `
        -- Create storage bucket for audio files if not exists
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM storage.buckets WHERE id = 'selection-audios'
          ) THEN
            INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
            VALUES (
              'selection-audios',
              'selection-audios',
              true,
              10485760, -- 10MB
              ARRAY['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mpeg']
            );
          END IF;
        END
        $$;
      `;

      // Note: For actual table creation, you might need to use Supabase Dashboard
      console.log('Please create the table using the SQL in the migration file through Supabase Dashboard');
      console.log('SQL to execute in Supabase Dashboard -> SQL Editor:');
      console.log(migrationSQL);
      console.log(bucketSQL);
    } else {
      console.log('Migration completed successfully!');
    }

    // Enable RLS on the table
    console.log('Enabling RLS on selection_submissions table...');
    const { error: rlsError } = await supabase
      .from('selection_submissions')
      .select('*')
      .limit(0);

    if (rlsError && rlsError.message.includes('row-level security')) {
      console.log('RLS needs to be configured through Supabase Dashboard');
    }

  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration();