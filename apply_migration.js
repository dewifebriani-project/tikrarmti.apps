const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.rpc('admin_exec_sql', {
    sql_query: "ALTER TABLE batches ADD COLUMN IF NOT EXISTS registration_info TEXT;"
  });
  console.log(data, error);
}
main();
