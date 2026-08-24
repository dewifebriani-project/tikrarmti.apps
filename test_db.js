const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('halaqah').select(`
    id,
    students:halaqah_students(
      status, 
      thalibah_id,
      users:users!halaqah_students_thalibah_id_fkey(full_name)
    )
  `).limit(1);
  console.log(error ? error : JSON.stringify(data, null, 2));
}
run();
