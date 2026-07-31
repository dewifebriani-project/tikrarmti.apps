import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data, error } = await supabaseAdmin.from('batches').select('id');
  console.log('Batches:', data?.length, error);
  
  // Custom query via our exec_sql rpc if it exists
  const { data: policies, error: polErr } = await supabaseAdmin.rpc('exec_sql', {
    query: "SELECT polname, roles, cmd FROM pg_policies WHERE tablename = 'batches';"
  });
  console.log('Policies:', policies, polErr);
}
check();
