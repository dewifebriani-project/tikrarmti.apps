import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load env vars
const envPath = path.resolve('.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!, {
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

async function main() {
  console.log('Fixing sync_user_roles_to_auth trigger...');
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlQuery });
  
  if (error) {
    console.error('Failed to update trigger:', error.message);
    process.exit(1);
  }
  
  console.log('Successfully updated trigger via exec_sql!');
  console.log('RPC Output:', data);
  
  // Now run the sync on all users to make sure missing raw_app_meta_data is populated correctly too!
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
  
  console.log('Running sync on all users...');
  const { data: syncData, error: syncError } = await supabase.rpc('exec_sql', { sql_query: syncAllSql });
  if (syncError) {
    console.error('Failed to sync users:', syncError.message);
    process.exit(1);
  }
  console.log('Successfully synced all existing users to auth!');
  console.log('RPC Output:', syncData);
}

main();
