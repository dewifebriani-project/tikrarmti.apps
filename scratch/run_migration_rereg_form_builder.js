const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const sql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/20260620_create_reregistration_questions.sql'), 'utf8');
  console.log('Executing Re-registration Form Builder SQL Migration...');
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error('Error executing SQL:', error);
  } else {
    console.log('Migration Result:', data);
  }
}

run();
