const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const uuid = 'b160bad3-cb37-4d52-9a65-577a00d21ab6';
  const { data: akad } = await supabase.from('muallimah_akads').select('*').eq('id', uuid);
  console.log('In muallimah_akads:', akad);
}
run();
