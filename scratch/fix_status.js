const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
  const { data, error } = await supabase
    .from('daftar_ulang_submissions')
    .update({ status: 'submitted', partner_status: 'submitted' })
    .eq('user_id', '9a4814e8-bfc8-4b91-b138-0f4a5f123e81') // Anisa Syami
    .eq('batch_id', '2478b493-1b6b-412a-a05f-6193db815a43')
    .select();
    
  console.log('Update Result:', data, error);
}

fix();
