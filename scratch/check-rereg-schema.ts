import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  console.log('Querying columns for daftar_ulang_submissions...');
  const { data, error } = await supabase.rpc('get_table_columns_info', { table_name_input: 'daftar_ulang_submissions' });
  
  if (error) {
    // If get_table_columns_info RPC doesn't exist, we can use a direct postgres query via REST if allowed, or query a single row to inspect keys
    console.log('RPC get_table_columns_info failed, querying a single row to inspect keys...');
    const { data: row, error: rowError } = await supabase
      .from('daftar_ulang_submissions')
      .select('*')
      .limit(1)
      .maybeSingle();
      
    if (rowError) {
      console.error('Row query failed:', rowError);
    } else {
      console.log('Columns in daftar_ulang_submissions:', Object.keys(row || {}));
    }
  } else {
    console.log('Columns info:', data);
  }
}

run().catch(console.error);
