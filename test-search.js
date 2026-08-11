const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const search = 'agus';
  const searchPattern = `%${search}%`;
  
  let q = supabase
    .from('daftar_ulang_submissions')
    .select('user_id, users!daftar_ulang_submissions_user_id_fkey!inner(full_name)')
    .or(`full_name.ilike.${searchPattern},nama_kunyah.ilike.${searchPattern}`, { foreignTable: 'users' });
    
  const { data, error } = await q;
  console.log('Error:', error);
  console.log('Data count:', data?.length);
  if (data?.length > 0) console.log(data[0]);
}
run();
