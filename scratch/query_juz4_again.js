const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: b } = await supabase.from('batches').select('id, name');
  const batch = b.find(x => x.name.includes('Batch 3'));
  console.log('Batch:', batch.id);

  const { data: h } = await supabase.from('halaqah').select('id, name, preferred_juz, muallimah_id').eq('preferred_juz', '4');
  console.log('Halaqah juz 4:', h);
  
  if (h && h.length > 0) {
    const { data: m } = await supabase.from('muallimah_registrations').select('id, full_name, preferred_juz').in('id', h.map(x => x.muallimah_id));
    console.log('Muallimahs for juz 4:', m);
  }
}
check();
