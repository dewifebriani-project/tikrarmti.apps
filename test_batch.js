const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.from('batches').update({ status: 'ongoing' }).eq('id', '070d65ff-72d9-4f7f-85ff-8533b664722a');
  console.log(error);
}
test();
