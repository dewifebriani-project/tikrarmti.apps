require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('batches').select('id, name, re_enrollment_date, opening_class_date').order('created_at', { ascending: false }).limit(2);
  if (error) console.error(error);
  else console.log('Rows:', data);
}

check();
