const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// We use anon key to simulate client-side fetch
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  // Login as Agustina (I don't have her password, I'll just check if we can query as anon)
  const { data: anonData, error: anonError } = await supabase.from('batch_zoom_links').select('*');
  console.log("Anon fetch:", anonError || anonData);
}
run();
