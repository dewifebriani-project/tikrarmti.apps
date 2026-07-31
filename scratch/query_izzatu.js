const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: h } = await supabase.from('halaqah').select('id, name, preferred_juz, muallimah_id');
  const { data: m } = await supabase.from('muallimah_registrations').select('id, full_name');
  
  const mMap = new Map();
  if (m) m.forEach(x => mMap.set(x.id, x.full_name));
  
  const matches = (h || []).filter(x => {
     const name = mMap.get(x.muallimah_id) || '';
     return name.toLowerCase().includes('izzatu');
  });
  console.log('Izzatu Halaqahs:', matches);
}
check();
