const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: ania } = await supabase
    .from('users')
    .select('id, full_name, roles')
    .ilike('full_name', '%ania%');
    
  console.log('Ania:', ania);
  
  if (ania && ania.length > 0) {
    const { data: halaqah } = await supabase
      .from('halaqah')
      .select('id, name')
      .eq('muallimah_id', ania[0].id);
      
    console.log('Halaqah Ania:', halaqah);
    
    const { data: mentors } = await supabase
      .from('halaqah_mentors')
      .select('*')
      .eq('halaqah_id', halaqah[0].id);
      
    console.log('Mentors for Ania halaqah:', mentors);
  }
}

main();
