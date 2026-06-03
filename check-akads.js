const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key] = val.join('=').replace('\r', '');
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: akads, error } = await supabase
    .from('muallimah_akads')
    .select('status, user_id, users!inner(full_name)')
    .ilike('users.full_name', '%najah%');
  
  console.log("Najah akads:", akads, error);
}

main();
