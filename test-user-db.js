const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, roles, role')
    .eq('email', 'dewifebriani@gmail.com');
  console.log('dewifebriani@gmail.com:', JSON.stringify(data, null, 2), error);
  
  // also check if there are any admins
  const { data: admins } = await supabase
    .from('users')
    .select('id, email, full_name, roles, role')
    .contains('roles', ['admin'])
    .limit(5);
  console.log('Admins in roles:', admins);
  
  const { data: admins2 } = await supabase
    .from('users')
    .select('id, email, full_name, roles, role')
    .eq('role', 'admin')
    .limit(5);
  console.log('Admins in role:', admins2);
  
  const { data: superAdmins } = await supabase
    .from('users')
    .select('id, email, full_name, roles, role')
    .contains('roles', ['super_admin'])
    .limit(5);
  console.log('super_admin in roles:', superAdmins);
}
check();
