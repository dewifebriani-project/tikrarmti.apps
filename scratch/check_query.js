const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: regs } = await supabase.from('pendaftaran_tikrar_tahfidz')
    .select('id, batch_id, status, chosen_juz, batches(name, start_date, opening_class_date)')
    .eq('user_id', '5e1b7339-1584-4144-a299-1d8788714fef');
  console.log('Regs:', JSON.stringify(regs, null, 2));
}
check();
