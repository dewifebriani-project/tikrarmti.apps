const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: reg, error } = await supabase.from('pendaftaran_tikrar_tahfidz')
    .select('*')
    .eq('user_id', '5e1b7339-1584-4144-a299-1d8788714fef')
    .eq('batch_id', '2478b493-1b6b-412a-a05f-6193db815a43')
    .single();
  console.log('Reg:', reg);
}
check();
