const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('id', '98caec64-1d74-4715-a05f-9b72f948e2db');
  console.log(data);
}
run();
