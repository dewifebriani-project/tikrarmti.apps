const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: user } = await supabase.from('users').select('id, full_name').ilike('full_name', '%Wahyu Suci Fatriyanti%').limit(1);
  console.log('User Wahyu:', user);
  
  if (user && user.length > 0) {
    // Check if there are any failed inserts in tashih_records... we can't see failed inserts in PG without logs.
    // Let's just find Mara Martalena again.
    const { data: mara } = await supabase.from('users').select('id, full_name').ilike('full_name', '%Mara Martalena%').limit(1);
    if (mara && mara.length > 0) {
      console.log('User Mara:', mara[0].id);
      const { data: regs } = await supabase.from('muallimah_registrations').select('id, status, user_id').eq('user_id', mara[0].id);
      console.log('Mara regs:', regs);
    }
  }
}
run();
