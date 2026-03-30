const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env vars
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const sqlQuery = `
CREATE OR REPLACE FUNCTION public.sync_user_roles_to_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- FIX: Using correct column name raw_app_meta_data
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_strip_nulls(jsonb_build_object(
      'roles', NEW.roles, 
      'role', NEW.role
    ))
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;
`;

const syncAllSql = `
DO $$
DECLARE
  user_row RECORD;
BEGIN
  FOR user_row IN SELECT * FROM public.users LOOP
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_strip_nulls(jsonb_build_object(
        'roles', user_row.roles, 
        'role', user_row.role
      ))
    WHERE id = user_row.id;
  END LOOP;
END;
$$;
`;

async function main() {
  console.log('--- Fixing sync_user_roles_to_auth trigger ---');
  const { data: triggerData, error: triggerError } = await supabase.rpc('exec_sql', { sql_query: sqlQuery });
  
  if (triggerError) {
    console.error('Failed to update trigger:', triggerError.message);
    process.exit(1);
  }
  
  console.log('Success: Trigger updated.');
  
  console.log('--- Syncing all existing users ---');
  const { data: syncData, error: syncError } = await supabase.rpc('exec_sql', { sql_query: syncAllSql });
  
  if (syncError) {
    console.error('Failed to sync users:', syncError.message);
    process.exit(1);
  }
  
  console.log('Success: All users synced.');
  console.log('Done.');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
