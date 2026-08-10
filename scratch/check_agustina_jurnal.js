const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const userId = '5e1b7339-1584-4144-a299-1d8788714fef';
  const { data, error } = await supabase.from('jurnal_records').select('*').eq('user_id', userId);
  console.log("Jurnal Records Count:", error || data.length);
  if (data && data.length > 0) {
     console.log("First record date:", data[0].tanggal_setor);
  }
}
run();
