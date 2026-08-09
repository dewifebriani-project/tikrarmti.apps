const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function check() {
  const { data: hal } = await supabase.from('halaqah_students')
    .select('status, halaqah_id, halaqah(name, status, program_id, programs(batch_id))')
    .eq('thalibah_id', '902b0145-14b1-4d18-9553-0cf7372112bf');
  console.log('Halaqah Students:', JSON.stringify(hal, null, 2));
}
check();
