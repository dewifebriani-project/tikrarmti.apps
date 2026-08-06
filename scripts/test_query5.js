const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('pendaftaran_tikrar_tahfidz')
    .select('id, user_id, ready_for_team')
    .eq('user_id', '1bbab15e-9bee-40ff-8a25-5daecaf06b45')
    .eq('batch_id', '2478b493-1b6b-412a-a05f-6193db815a43');
  console.log('--- Pendaftaran Yandesmira Batch 3 ---');
  console.log(data);
}
run();
