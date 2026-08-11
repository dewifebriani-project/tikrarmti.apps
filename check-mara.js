const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: user } = await supabase.from('users').select('id, full_name').ilike('full_name', '%Mara Martalena%');
  console.log('User:', user);
  if (user && user.length > 0) {
    const { data: reg } = await supabase.from('muallimah_registrations').select('id').eq('user_id', user[0].id);
    console.log('Reg:', reg);
  }
}
run();
