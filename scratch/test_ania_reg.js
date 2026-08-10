const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
const supabaseKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const userId = '079ec4b5-8fad-4fe7-8e0e-7345c9454009';
  const { data: regs } = await supabase
    .from('pendaftaran_tikrar_tahfidz')
    .select('id, batch_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  console.log('Regs:', regs);
}
test();
