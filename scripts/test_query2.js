const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('batches')
    .select('id, name')
    .ilike('name', '%Batch 3%');
  console.log('--- BATCH 3 ---');
  console.log(data);
}
run();
