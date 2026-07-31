const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('id', '980fad0d-fae5-4cab-b483-37a30493a816');
  
  if (error) console.error(error);
  else console.log(data);
}
check();
