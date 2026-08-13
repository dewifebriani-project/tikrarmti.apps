const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: akads, error } = await supabase.from('muallimah_akads').select('user_id');
  if (error) console.error(error);
  
  if (akads && akads.length > 0) {
    const userIds = akads.map(a => a.user_id);
    const { data: regs, error: e2 } = await supabase.from('muallimah_registrations').select('user_id').in('user_id', userIds);
    if (e2) console.error(e2);
    
    const regUserIds = new Set(regs.map(r => r.user_id));
    const missing = userIds.filter(id => !regUserIds.has(id));
    
    console.log("Total in muallimah_akads:", userIds.length);
    console.log("Total matching in muallimah_registrations:", regUserIds.size);
    console.log("Missing user_ids:", missing);
  }
}
run();
