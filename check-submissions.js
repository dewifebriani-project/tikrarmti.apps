require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('daftar_ulang_submissions')
    .select('*')
    .or(`ujian_halaqah_id.eq.256b34e7-178d-420c-a484-39802102946a,tashih_halaqah_id.eq.256b34e7-178d-420c-a484-39802102946a`);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log(`Found ${data.length} submissions for halaqah`);
  }
}

run();
