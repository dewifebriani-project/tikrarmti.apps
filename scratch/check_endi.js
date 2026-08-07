const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: du } = await supabase
    .from('daftar_ulang_submissions')
    .select('user_id, confirmed_full_name, status, akad_status, partner_status, akad_files')
    .ilike('confirmed_full_name', '%Endi%');
    
  console.log('DAFTAR ULANG:', JSON.stringify(du, null, 2));
}

check();
