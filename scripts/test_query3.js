const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('daftar_ulang_submissions')
    .select('*')
    .eq('user_id', '1bbab15e-9bee-40ff-8a25-5daecaf06b45')
    .eq('batch_id', '2478b493-1b6b-412a-a05f-6193db815a43');
  console.log('--- YANDESMIRA BATCH 3 SUBMISSIONS ---');
  console.log(data);
}
run();
