const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.rpc('get_tables'); // Or whatever is available, or query directly
  
  // Or query information_schema via query
  const res = await supabase.from('users').select('*').limit(1);
  console.log(res);
}
run();
