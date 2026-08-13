const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: reg } = await supabase.from('muallimah_registrations').select('*').eq('id', 'edf35c08-1f82-4ed4-9cd9-2304b8f19dc8');
  console.log("Reg:", reg);
}
run();
