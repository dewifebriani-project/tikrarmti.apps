const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
const supabaseKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: users } = await supabase.from('users').select('id, full_name').or('full_name.ilike.%ania%,full_name.ilike.%kardina%');
  console.log('Users:', users);
  for (const u of users || []) {
    const { data: subs } = await supabase.from('daftar_ulang_submissions').select('id, user_id, partner_user_id, status, partner_status, partner_type').eq('user_id', u.id);
    console.log('Submissions for', u.full_name, ':', subs);
  }
}
test();
