const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: users, error } = await supabase.from('users').select('*').ilike('full_name', '%Agustina%');
  if (!users || users.length === 0) return console.log('Not found');
  
  for (const user of users) {
    console.log('User:', user.full_name, user.id);
    
    const { data: sub } = await supabase.from('daftar_ulang_submissions').select('*').eq('user_id', user.id).single();
    console.log('Sub:', sub);

    const { data: p } = await supabase.from('paired_users').select('*').or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id},user_3_id.eq.${user.id}`);
    console.log('Paired:', p);
  }
}
check();
