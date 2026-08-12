const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase
      .from('halaqah')
      .select(`
        id,
        mentors:halaqah_mentors(
          id, mentor_id, role,
          users:users!halaqah_mentors_mentor_id_fkey(full_name, email)
        )
      `)
      .not('mentors', 'is', null);

  // filter locally just in case
  const withMusyrifah = data?.filter(h => h.mentors.some(m => m.role === 'musyrifah' || m.role === 'roisah'));
  console.log(JSON.stringify(withMusyrifah?.slice(0, 2), null, 2));
  console.log('Error:', error);
}

main();
