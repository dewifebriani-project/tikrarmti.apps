const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: users } = await supabase.from('users').select('id, full_name').ilike('full_name', '%Agna Rola%');
  if (!users || users.length === 0) return console.log('User not found');
  const userId = users[0].id;
  
  const startDate = new Date('2026-08-10T00:00:00+07:00');
  startDate.setDate(startDate.getDate() + 7);
  const endDate = new Date('2026-08-10T00:00:00+07:00');
  endDate.setDate(endDate.getDate() + 14);
  
  const { data: jurnal } = await supabase.from('jurnal_records').select('blok, created_at').eq('user_id', userId).gte('created_at', startDate.toISOString()).lt('created_at', endDate.toISOString());
  console.log('Jurnal submissions for Agna Rola in Week 2 range (', startDate.toISOString(), 'to', endDate.toISOString(), '):');
  console.log(jurnal);
}
run();
