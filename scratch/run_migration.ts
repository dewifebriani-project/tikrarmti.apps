import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const sql = fs.readFileSync(path.join(process.cwd(), 'scratch/migration.sql'), 'utf8');
  console.log('Executing SQL...');
  
  const { data, error } = await supabase.rpc('exec_sql', { sql: sql });
  
  if (error) {
    console.error('Error executing SQL:', error);
  } else {
    console.log('Result:', data);
  }
}

run();
