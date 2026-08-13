const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: batches } = await supabaseAdmin.from('batches').select('id').limit(1);
  if (!batches || batches.length === 0) return console.log('No batches');
  const { data, error } = await supabaseAdmin
    .from('programs')
    .insert({
      name: 'Test Muallimah Program',
      batch_id: batches[0].id,
      class_type: 'muallimah',
      status: 'active'
    });
  console.log('Result:', error || 'Success');
}

main();
