const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: h } = await supabase.from('halaqah').select('id').limit(1).single();
  const { data: u } = await supabase.from('users').select('id').limit(1).single();
  
  console.log('Testing upsert with halaqah_id:', h?.id, 'and mentor_id:', u?.id);
  
  const { error } = await supabase
    .from('halaqah_mentors')
    .upsert({
      halaqah_id: h.id,
      mentor_id: u.id,
      role: 'musyrifah',
      is_primary: false
    }, { onConflict: 'halaqah_id,mentor_id' });
    
  console.log('Upsert Error:', error);
}

main();
