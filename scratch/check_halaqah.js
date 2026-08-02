require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: tables } = await supabase.from('information_schema.tables').select('table_name').eq('table_schema', 'public');
  // the information_schema query usually doesn't work directly from the API unless exposed. 
  // Let's just query what we suspect.
  const { data: halaqah } = await supabase.from('halaqah').select('*').limit(1);
  console.log("Halaqah:", JSON.stringify(halaqah, null, 2));

  const { data: pairings } = await supabase.from('pairings').select('*').limit(1);
  console.log("Pairings:", JSON.stringify(pairings, null, 2));
}
check();
