const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('daftar_ulang_submissions')
    .update({
      partner_type: null,
      partner_user_id: null,
      partner_name: null,
      partner_relationship: null,
      partner_wa_phone: null,
      partner_notes: null
    })
    .is('ujian_halaqah_id', null)
    .not('partner_type', 'is', null)
    .select('id, user_id, partner_type');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Fixed submissions:', data);
  }
}

run();
