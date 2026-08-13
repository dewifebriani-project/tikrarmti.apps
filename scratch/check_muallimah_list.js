const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: akads } = await supabase
      .from('muallimah_akads')
      .select('id, user_id, preferred_juz, status, user:users!muallimah_akads_user_id_fkey(full_name)')
      .limit(5);
  console.log("Akads:", akads);
  
  if (akads && akads.length > 0) {
    const { data: regs } = await supabase.from('muallimah_registrations').select('id, user_id').in('user_id', akads.map(a => a.user_id));
    console.log("Regs:", regs);
  }
}
run();
