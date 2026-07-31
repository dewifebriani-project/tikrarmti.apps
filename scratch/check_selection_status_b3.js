const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase
    .from('pendaftaran_tikrar_tahfidz')
    .select('selection_status, programs(class_type)')
    .eq('batch_id', '2478b493-1b6b-412a-a05f-6193db815a43')
    .in('status', ['pending', 'approved']);
  
  if (error) console.error(error);
  else {
    const stats = {};
    data.forEach(d => {
      const t = d.programs?.class_type || 'unknown';
      const s = d.selection_status || 'null';
      if (!stats[t]) stats[t] = {};
      stats[t][s] = (stats[t][s] || 0) + 1;
    });
    console.log(stats);
  }
}
check();
