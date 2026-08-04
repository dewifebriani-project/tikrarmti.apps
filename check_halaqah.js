const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('email', 'zainabummukhadijah@gmail.com');

  if (userError || !users.length) {
    console.error('User not found:', userError);
    return;
  }
  const user = users[0];
  console.log('Muallimah:', user);
  
  const { data: mentorRoles, error: mentorError } = await supabase
    .from('halaqah_mentors')
    .select('halaqah_id, role, halaqah:halaqah_id(*)')
    .eq('mentor_id', user.id);
    
  if (mentorError) {
    console.error('Error fetching halaqah mentors:', mentorError);
    return;
  }
  
  console.log('\nHalaqah for this Muallimah:');
  mentorRoles.forEach(m => {
    console.log(`- Halaqah ID: ${m.halaqah.id}`);
    console.log(`  Name: ${m.halaqah.name}`);
    console.log(`  Day of week: ${m.halaqah.day_of_week} (1=Mon, 7=Sun)`);
    console.log(`  Start time: ${m.halaqah.start_time}`);
    console.log(`  End time: ${m.halaqah.end_time}`);
  });
}

run();
