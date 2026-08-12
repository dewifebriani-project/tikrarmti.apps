const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('tashih_records').select('id, user_id, ustadzah_id, waktu_tashih').order('waktu_tashih', { ascending: false }).limit(20);
  console.log(error || data);
}
run();
