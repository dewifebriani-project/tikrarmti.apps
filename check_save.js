const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function check() {
  const { data, error } = await supabase
      .from('daftar_ulang_submissions')
      .update({ ujian_halaqah_id: '31e782c0-d387-45ea-83a1-fa4797395e5b', tashih_halaqah_id: '31e782c0-d387-45ea-83a1-fa4797395e5b' })
      .eq('user_id', '902b0145-14b1-4d18-9553-0cf7372112bf')
      .eq('batch_id', '2478b493-1b6b-412a-a05f-6193db815a43')
      .select();
  console.log('Update res:', data, error);
}
check();
