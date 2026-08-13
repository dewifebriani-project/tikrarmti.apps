const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('tashih_records').select('id, ustadzah_id').limit(5);
  console.log("Tashih Records:", data);
  if (data && data.length > 0) {
    const { data: reg } = await supabase.from('muallimah_registrations').select('id').eq('id', data[0].ustadzah_id);
    console.log("Found in muallimah_registrations:", reg);
    const { data: u } = await supabase.from('users').select('id').eq('id', data[0].ustadzah_id);
    console.log("Found in users:", u);
  }
}
run();
