const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('pendaftaran_tikrar_tahfidz')
    .select('ready_for_team');
  const distinct = [...new Set(data.map(d => d.ready_for_team))];
  console.log(distinct);
}
run();
