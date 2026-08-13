const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: users, error } = await supabase.from('users').select('*').ilike('full_name', '%Eka sri%');
  console.log("Users:", users);
  
  const { data: halaqah, error: err2 } = await supabase.from('halaqah').select('*').ilike('name', '%Eka sri%');
  console.log("Halaqah:", halaqah);
}
run();
