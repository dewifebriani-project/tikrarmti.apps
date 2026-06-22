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
  console.log('Updating input types in reregistration_questions...');
  
  // Update partner_type to info
  const { error: err1 } = await supabase
    .from('reregistration_questions')
    .update({ input_type: 'info' })
    .eq('field_key', 'partner_type');
    
  if (err1) console.error('Error updating partner_type:', err1);
  else console.log('Successfully set partner_type to info.');

  // Update card fields to radio
  const cards = ['partner_self_match', 'partner_system_match', 'partner_family', 'partner_tarteel'];
  const { error: err2 } = await supabase
    .from('reregistration_questions')
    .update({ input_type: 'radio' })
    .in('field_key', cards);

  if (err2) console.error('Error updating partner matching cards:', err2);
  else console.log('Successfully set partner matching cards to radio.');

  console.log('Update completed!');
}

run();
