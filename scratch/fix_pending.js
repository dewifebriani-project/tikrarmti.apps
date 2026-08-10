const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
  const { data, error } = await supabase.from('pendaftaran_tikrar_tahfidz')
    .update({ status: 'approved' })
    .in('selection_status', ['selected', 'waitlist'])
    .eq('status', 'pending');
    
  console.log('Error:', error);
  console.log('Updated:', data);
}
fix();
