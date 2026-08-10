const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const userId = '5e1b7339-1584-4144-a299-1d8788714fef';
  const { data, error } = await supabase.from('pendaftaran_tikrar_tahfidz').select('id, batch_id, status, batch:batches(name, start_date)').eq('user_id', userId);
  console.log("Registrations:", error || data);
}
run();
