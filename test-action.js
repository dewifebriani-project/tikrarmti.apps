const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const finalUstadzahId_initial = '5b7a79bb-83d4-4799-9057-dcc57f5ea4e5'; // Mara
  let finalUstadzahId = finalUstadzahId_initial;

  const { data: reg } = await supabase
    .from('muallimah_registrations')
    .select('id')
    .eq('user_id', finalUstadzahId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (reg && reg.id) {
    finalUstadzahId = reg.id;
  } else {
    finalUstadzahId = null;
  }

  const { data: user } = await supabase.from('users').select('id').limit(1);
  const recordData = {
    user_id: user[0].id,
    blok: 'H1A',
    lokasi: 'MARAKAZ (MTI)',
    ustadzah_id: finalUstadzahId,
    jumlah_kesalahan_tajwid: 0,
    masalah_tajwid: [],
    waktu_tashih: new Date().toISOString()
  };

  const { error } = await supabase.from('tashih_records').insert(recordData);
  console.log('Final inserted ustadzah_id:', finalUstadzahId);
  console.log('Error:', error);
}
run();
