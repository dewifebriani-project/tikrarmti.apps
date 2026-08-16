const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase.from('batches').update({ registration_end_date: '2026-09-30T16:59:00+00:00' }).eq('id', '2478b493-1b6b-412a-a05f-6193db815a43');
  if (error) console.error(error);
  console.log('Update success');
}
main();
