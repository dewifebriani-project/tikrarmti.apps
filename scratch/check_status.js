const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: users, error: err1 } = await supabase
    .from('users')
    .select('id, full_name')
    .or('full_name.ilike.%Nurkamala Sari%,full_name.ilike.%Endi Hasan%');
    
  if (err1) {
    console.error('Error fetching users:', err1);
    return;
  }
    
  console.log('USERS:', users);
  
  if (users?.length) {
    const userIds = users.map(u => u.id);
    
    const { data: du, error: err2 } = await supabase
      .from('daftar_ulang_submissions')
      .select('user_id, status, akad_status, partner_status, akad_files, created_at, updated_at')
      .in('user_id', userIds);
      
    console.log('DAFTAR ULANG:', JSON.stringify(du, null, 2), err2);
  }
}

check();
