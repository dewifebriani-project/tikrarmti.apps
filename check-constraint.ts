import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  const { data, error } = await supabase.rpc('admin_exec_sql', {
    sql_query: "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'users_roles_check'"
  });
  console.log(data, error);
}

main();
