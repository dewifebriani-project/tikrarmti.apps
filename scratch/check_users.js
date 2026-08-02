require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: users, error } = await supabase.from('users').select('*').not('whatsapp', 'is', null).limit(3);
  if (error) console.error(error);
  console.log("users:", JSON.stringify(users, null, 2));
}
check();
