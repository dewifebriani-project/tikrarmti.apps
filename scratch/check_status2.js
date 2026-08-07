const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name')
    .ilike('full_name', '%Endi%');
    
  console.log('USERS:', users);
  
  if (users?.length) {
    const userIds = users.map(u => u.id);
    
    const { data: du } = await supabase
      .from('daftar_ulang_submissions')
      .select('user_id, status, akad_status, partner_status')
      .in('user_id', userIds);
      
    console.log('DAFTAR ULANG:', du);
  }
}

check();
