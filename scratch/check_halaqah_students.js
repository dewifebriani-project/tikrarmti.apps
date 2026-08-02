require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: halaqah_students, error } = await supabase.from('halaqah_students').select('*, user:users!halaqah_students_thalibah_id_fkey(*)').limit(1);
  if (error) console.error(error);
  console.log("halaqah_students:", JSON.stringify(halaqah_students, null, 2));
}
check();
