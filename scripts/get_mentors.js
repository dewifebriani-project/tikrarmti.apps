const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: mentors, error: mError } = await supabase
    .from('halaqah_mentors')
    .select(`
      halaqah_id,
      role,
      user:users!halaqah_mentors_mentor_id_fkey(id, full_name, role)
    `)
    .limit(5);

  if (mError) {
    console.error('Error fetching mentors:', mError);
  } else {
    console.log(JSON.stringify(mentors, null, 2));
  }
}

run();
