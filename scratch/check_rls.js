const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: policies } = await supabase.rpc('get_policies'); // Wait, there's no such RPC.
  // I will just execute raw SQL to get policies on batch_zoom_links
}
