const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: h } = await supabase.from('halaqah').select('id, name, preferred_juz, muallimah_id');
  const { data: m } = await supabase.from('muallimah_registrations').select('id, full_name, preferred_juz');
  
  const hList = h || [];
  const mList = m || [];
  
  const mIds = mList.filter(x => x.full_name && x.full_name.toLowerCase().includes('izzatu')).map(x => x.id);
  console.log('Muallimah Ids:', mIds);
  
  const myH = hList.filter(x => mIds.includes(x.muallimah_id));
  console.log('Her Halaqahs:', myH);
}
check();
