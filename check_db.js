require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('daftar_ulang_submissions')
    .select('status')
    
  if (error) {
    console.error(error);
    return;
  }
  
  const statuses = new Set(data.map(d => d.status));
  console.log('Unique statuses in daftar_ulang_submissions:', Array.from(statuses));
  
  const { data: userData } = await supabase
    .from('users')
    .select('is_blacklisted')
    .limit(10);
    
  console.log('User flags:', Object.keys(userData[0] || {}));
}
check();
