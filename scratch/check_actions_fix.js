const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: records } = await supabase.from('tashih_records').select('id, ustadzah_id').not('ustadzah_id', 'is', null).limit(10);
  console.log("Records with ustadzah_id:", records);
}
run();
