const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function check() {
  const { data: halaqahs } = await supabase.from('halaqah').select('id, name, day_of_week, start_time, end_time, zoom_link_id').limit(1);
  const { data: zooms } = await supabase.from('zoom_links').select('*').limit(1);
  console.log('Halaqah:', halaqahs);
  console.log('Zoom:', zooms);
}
check();
