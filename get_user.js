const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: reg, error: regError } = await supabase
    .from('pendaftaran_tikrar_tahfidz')
    .select('id, status, selection_status, created_at')
    .eq('user_id', '10e91c5b-2247-44e7-b40b-c8c345f071f1')
    .order('created_at', { ascending: false });
    
  console.log('Registrations:', reg);
}

run();
