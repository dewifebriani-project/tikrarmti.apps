const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: user } = await supabase.from('users').select('id').limit(1);
  const { error } = await supabase.from('tashih_records').insert({
    user_id: user[0].id,
    blok: 'H1A',
    lokasi: 'MARAKAZ (MTI)',
    ustadzah_id: null,
    jumlah_kesalahan_tajwid: 0,
    masalah_tajwid: [],
    waktu_tashih: new Date().toISOString()
  });
  console.log('Error inserting null:', error);
}
run();
