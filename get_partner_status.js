const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('daftar_ulang_submissions')
    .select('id, user_id, status, partner_status, partner_type, partner_user_id')
    .limit(10);
  console.log(data);
}

run();
