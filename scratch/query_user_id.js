const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: users } = await supabase.from('users').select('id, full_name, email').ilike('full_name', '%Izzatu%');
  console.log('Users:', users);
  
  if (users && users.length > 0) {
    const { data: h } = await supabase.from('halaqah').select('id, name, preferred_juz, muallimah_id').in('muallimah_id', users.map(u => u.id));
    console.log('Halaqah for User IDs:', h);
  }
}
check();
