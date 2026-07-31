const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase
    .from('pendaftaran_tikrar_tahfidz')
    .select('id, selection_status, program_id, programs(class_type)')
    .eq('batch_id', '2478b493-1b6b-412a-a05f-6193db815a43')
    .limit(5);
  
  if (error) console.error(error);
  else console.log(data);
}
check();
