const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.rpc('admin_exec_sql', { 
    sql_query: `
      SELECT tablename, policyname, permissive, roles, cmd, qual 
      FROM pg_policies 
      WHERE tablename IN ('users', 'batch_zoom_links', 'halaqah')
    `
  });
  console.log(error || data);
}
run();
