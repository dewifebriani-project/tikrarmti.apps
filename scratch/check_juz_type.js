const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: cols } = await supabase.rpc('get_schema');
  const { data: sample } = await supabase.from('muallimah_registrations').select('id, full_name, preferred_juz').ilike('full_name', '%Izzatu%');
  console.log('Sample:', sample);
  console.log('Type of preferred_juz:', typeof sample[0].preferred_juz);
  console.log('Is Array?', Array.isArray(sample[0].preferred_juz));
}
check();
