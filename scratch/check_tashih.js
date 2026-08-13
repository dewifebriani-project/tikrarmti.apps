const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.rpc('get_schema_info', { table_name: 'tashih_records' }).catch(() => ({}));
  console.log("Schema:", data, error);
}
run();
