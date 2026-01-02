-- Drop the trigger that causes updated_at error
DROP TRIGGER IF EXISTS update_muallimah_registrations_reviewed_at ON muallimah_registrations;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Verify no more triggers exist
SELECT trigger_name, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'muallimah_registrations';
