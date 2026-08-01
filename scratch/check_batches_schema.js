const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/dewifebrinani/My Projects/tikrarmti.apps/.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('batches').select('*').limit(1);
  console.log(Object.keys(data[0] || {}));
}
check();
