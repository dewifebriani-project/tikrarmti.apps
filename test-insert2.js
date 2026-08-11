const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: user } = await supabase.from('users').select('id, full_name').ilike('full_name', '%Agna Rola%').limit(1);
  const validUserId = user[0].id;
  
  // Try inserting with muallimah_registrations.id
  const regId = 'b160bad3-cb37-4d52-9a65-577a00d21ab6'; // Mara Martalena's reg ID
  
  const { data, error } = await supabase.from('tashih_records').insert({
    user_id: validUserId,
    blok: 'H1A',
    lokasi: 'MARAKAZ (MTI)',
    ustadzah_id: regId, 
    jumlah_kesalahan_tajwid: 0,
    masalah_tajwid: [],
    waktu_tashih: new Date().toISOString()
  });
  console.log('Error with regId:', error);

  if (error) {
    // Try inserting with users.id
    const userId = '5b7a79bb-83d4-4799-9057-dcc57f5ea4e5'; // Mara Martalena's user ID
    const { error: error2 } = await supabase.from('tashih_records').insert({
      user_id: validUserId,
      blok: 'H1A',
      lokasi: 'MARAKAZ (MTI)',
      ustadzah_id: userId, 
      jumlah_kesalahan_tajwid: 0,
      masalah_tajwid: [],
      waktu_tashih: new Date().toISOString()
    });
    console.log('Error with userId:', error2);
  }
}
run();
