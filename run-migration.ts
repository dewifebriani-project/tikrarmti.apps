import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const sql = `SELECT 1;`;
  const result1 = await supabase.rpc('exec_sql', { sql_query: sql });
  console.log('Result 1 (exec_sql sql_query):', result1);
  const result2 = await supabase.rpc('exec_sql', { sql: sql });
  console.log('Result 2 (exec_sql sql):', result2);
  const result3 = await supabase.rpc('admin_exec_sql', { sql_query: sql });
  console.log('Result 3 (admin_exec_sql sql_query):', result3);
}

main().catch(console.error);
