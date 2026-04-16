import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load env from .env.local
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const migrationPath = join(__dirname, 'supabase', 'migrations', '20260328_final_admin_access_fix.sql');
const sql = readFileSync(migrationPath, 'utf-8');

console.log('Applying migration: 20260328_final_admin_access_fix.sql');

// Use Postgres RPC to execute SQL if available, or just log instructions
const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

if (error) {
  console.error('Error applying migration via RPC:', error.message);
  console.log('\nRPC "exec_sql" might not be available. Please apply the SQL manually in the Supabase SQL Editor:');
  console.log('--------------------------------------------------------------------------------');
  console.log(sql);
  console.log('--------------------------------------------------------------------------------');
} else {
  console.log('Migration applied successfully!');
}
