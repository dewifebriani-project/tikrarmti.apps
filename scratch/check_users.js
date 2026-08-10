const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const userId = '5e1b7339-1584-4144-a299-1d8788714fef';
  const { data, error } = await supabase.from('users').select('full_name, roles').eq('id', userId).single();
  console.log("User:", error || data);
}
run();
