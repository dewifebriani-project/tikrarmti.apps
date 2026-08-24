const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: user } = await supabaseAdmin.from('users').select('id').ilike('full_name', '%Agna Rola%').single();
  const res = await supabaseAdmin.from('jurnal_records').select('*').eq('user_id', user.id).eq('blok', 'H1A');
  console.log('Total H1A records for Agna Rola:', res.data.length);
}
run();
