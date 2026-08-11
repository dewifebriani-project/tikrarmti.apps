const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const finalUstadzahId_initial = '5b7a79bb-83d4-4799-9057-dcc57f5ea4e5'; // Mara

  const { data: reg, error } = await supabase
    .from('muallimah_registrations')
    .select('id')
    .eq('user_id', finalUstadzahId_initial)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  console.log('reg:', reg);
  console.log('error:', error);
}
run();
