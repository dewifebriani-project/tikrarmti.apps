-- Check for triggers on muallimah_registrations table
SELECT
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'muallimah_registrations';

-- Check for rules on muallimah_registrations table
SELECT
    rule_name,
    definition
FROM pg_rules
WHERE tablename = 'muallimah_registrations';

-- Check table columns to verify updated_at doesn't exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'muallimah_registrations'
AND table_schema = 'public'
ORDER BY ordinal_position;
