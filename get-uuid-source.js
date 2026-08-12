const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const uuid = 'b160bad3-cb37-4d52-9a65-577a00d21ab6';
  const { data: user } = await supabase.from('users').select('id, email, full_name').eq('id', uuid);
  const { data: reg } = await supabase.from('muallimah_registrations').select('id, user_id, full_name').eq('id', uuid);
  console.log('In users:', user);
  console.log('In muallimah_registrations:', reg);
}
run();
