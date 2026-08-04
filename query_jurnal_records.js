require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  const { data, error } = await supabase
    .from('jurnal_records')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

main();
