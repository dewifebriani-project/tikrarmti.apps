const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.rpc('get_foreign_keys', { table_name: 'tashih_records' }).catch(() => ({}));
  console.log("RPC Error:", error);
  
  // Alternative query via raw REST if rpc doesn't exist
  // We can query information_schema if we had raw access, but let's query a user Eka sriharyanti and see if she is in muallimah_registrations or users.
}
run();
