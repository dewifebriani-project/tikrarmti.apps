const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUser() {
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .ilike('full_name', '%Sela Jamaluddin%');
  
  if (!users || users.length === 0) {
    console.log('User not found');
    return;
  }
  
  console.log('User:', users[0].full_name, users[0].id);
  
  const { data: submissions } = await supabase
    .from('daftar_ulang_submissions')
    .select('*')
    .eq('user_id', users[0].id)
    .order('created_at', { ascending: false });
    
  console.log('Submissions:', JSON.stringify(submissions, null, 2));
}

checkUser();
