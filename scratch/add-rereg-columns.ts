import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  const sql = `
    ALTER TABLE public.daftar_ulang_submissions 
    ADD COLUMN IF NOT EXISTS ready_for_team text;
    
    ALTER TABLE public.daftar_ulang_submissions 
    ADD COLUMN IF NOT EXISTS infaq_amount text;
  `;

  console.log('Running SQL migration to add columns...');
  
  let result = await supabase.rpc('exec_sql', { sql_query: sql });
  if (result.error) {
    console.log('Retrying with "sql" parameter...', result.error.message);
    result = await supabase.rpc('exec_sql', { sql: sql });
  }
  
  if (result.error) {
     console.log('Retrying with admin_exec_sql...', result.error.message);
     result = await supabase.rpc('admin_exec_sql', { sql_query: sql });
  }

  if (result.error) {
    console.error('Migration failed:', result.error);
  } else {
    console.log('Migration successful! Columns added successfully.', result.data);
  }
}

run().catch(console.error);
