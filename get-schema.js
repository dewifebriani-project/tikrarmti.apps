require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'muallimah_akads' });
  if (error) {
    // Fallback to checking via REST API by querying one row
    console.log("RPC get_table_columns failed, fallback to querying single row keys");
    const { data: row, error: queryErr } = await supabase.from('muallimah_akads').select('*').limit(1).single();
    if (queryErr) console.error(queryErr);
    else console.log(Object.keys(row));
  } else {
    console.log(data);
  }
}

run();
