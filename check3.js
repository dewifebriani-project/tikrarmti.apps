const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function check() {
  const { data: reg, error } = await supabase.from('pendaftaran_tikrar_tahfidz').select('full_name, user_id').ilike('full_name', '%agustina%');
  console.log('Reg:', JSON.stringify(reg));
  console.log('Error:', error);
  if(reg && reg.length > 0) {
    const { data: sub } = await supabase.from('daftar_ulang_submissions').select('*').eq('user_id', reg[0].user_id);
    console.log('Sub:', JSON.stringify(sub));
    const { data: p } = await supabase.from('study_partners').select('*').or(`user_1_id.eq.${reg[0].user_id},user_2_id.eq.${reg[0].user_id}`);
    console.log('Paired:', JSON.stringify(p));
  }
}
check();
