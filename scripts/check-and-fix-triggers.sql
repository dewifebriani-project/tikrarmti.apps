-- Check for any triggers that might be setting updated_at
SELECT
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing,
    event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'muallimah_registrations'
   OR event_object_table = 'musyrifah_registrations';

-- If any triggers found that set updated_at, drop them
-- Uncomment and run if triggers are found:

-- DROP TRIGGER IF EXISTS set_updated_at ON muallimah_registrations;
-- DROP TRIGGER IF EXISTS set_updated_at ON musyrifah_registrations;

-- Also check if there's a trigger function being used
SELECT
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_trigger t ON t.tgfoid = p.oid
JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relname = 'muallimah_registrations';
