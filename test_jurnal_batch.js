require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  const { data: b3Users } = await supabase.from('daftar_ulang_submissions').select('user_id').eq('batch_id', '2478b493-1b6b-412a-a05f-6193db815a43');
  const b3UserIds = b3Users.map(u => u.user_id);

  const { data: oldJournals } = await supabase
    .from('jurnal_records')
    .select('id, user_id, tanggal_setor, created_at')
    .in('user_id', b3UserIds)
    .order('tanggal_setor', { ascending: false })
    .limit(5);

  console.log("Old journals found for Batch 3 users:", oldJournals.length);
  if (oldJournals.length > 0) {
    console.log("Example dates:", oldJournals);
  }
}
main();
