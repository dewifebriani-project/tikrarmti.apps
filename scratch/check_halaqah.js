const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: pData, error } = await supabase
    .rpc('get_pairing_status', { 
      p_user_id: 'fb1c6340-164e-4a52-b4a1-06f38ef7ea30', // Fani
      p_batch_id: '2478b493-1b6b-412a-a05f-6193db815a43'
    });
    
  console.log('Fani Pairing Data:', JSON.stringify(pData, null, 2), error);
}

check();
