require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data: batches } = await supabase.from('batches').select('id, name');
  const batchId = batches.find(b => b.name.includes('Batch 3')).id;
  
  const res = await fetch(`http://localhost:3000/api/admin/pairing/statistics?batchId=${batchId}`);
  const json = await res.json();
  console.log(JSON.stringify(json.statistics.selfMatch, null, 2));
}

test();
