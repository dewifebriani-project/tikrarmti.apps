const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key] = val.join('=').replace('\r', '');
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: regs } = await supabase
    .from('muallimah_registrations')
    .select('user_id, full_name, status')
    .eq('status', 'approved');
  
  console.log("Approved registrations:", regs.filter(r => r.full_name.includes('Najah')));

  const userIds = Array.from(new Set(regs.map(r => r.user_id)));
  
  const { data: users, error } = await supabase
    .from('users')
    .select('id, full_name, roles, role')
    .in('id', userIds)
    .order('full_name', { ascending: true });
    
  console.log("Users in examiner list:", users.filter(u => u.full_name && u.full_name.includes('Najah')));
}

main();
