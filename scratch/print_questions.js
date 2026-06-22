const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('registration_questions')
    .select('id, field_key, section, label, sort_order, input_type')
    .order('section', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Tikrar Registration Questions:');
  data.forEach(q => {
    console.log(`Section ${q.section} | Order #${q.sort_order} | Key: ${q.field_key} | Type: ${q.input_type} | Label: ${q.label.substring(0, 60)}...`);
  });
}

run();
