const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: batches } = await supabase.from('batches').select('id, name, status');
  for (const b of batches) {
    const { count } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('*', { count: 'exact', head: true })
      .eq('batch_id', b.id);
    console.log(`Batch ${b.name} (${b.id}): ${count} pendaftar`);
  }
}
check();
