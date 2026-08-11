const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: users } = await supabase.from('users').select('id').limit(1);
  const validUserId = users[0].id;
  
  const { data, error } = await supabase.from('tashih_records').insert({
    user_id: validUserId,
    blok: 'H1A',
    lokasi: 'MARAKAZ (MTI)',
    ustadzah_id: '12345678-1234-1234-1234-123456789012', 
    jumlah_kesalahan_tajwid: 0,
    masalah_tajwid: [],
    waktu_tashih: new Date().toISOString()
  });
  console.log('Error:', error);
}
run();
