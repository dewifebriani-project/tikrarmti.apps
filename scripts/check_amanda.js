const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .ilike('full_name', '%amanda octaviana%');
  
  console.log("Users:", users);

  if (users && users.length > 0) {
    for (const user of users) {
      console.log(`Checking exams for ${user.id}...`);
      
      const { data: results } = await supabase
        .from('ujian_halaqah_results')
        .select('*')
        .eq('student_id', user.id);
      
      console.log(`Ujian Results for ${user.id}:`, results);

      const { data: submissions } = await supabase
        .from('pendaftaran_tikrar_tahfidz')
        .select('*')
        .eq('user_id', user.id);
      
      console.log(`Pendaftaran for ${user.id}:`, submissions);

      const { data: daftarUlang } = await supabase
        .from('daftar_ulang_submissions')
        .select('*')
        .eq('user_id', user.id);
      
      console.log(`Daftar Ulang for ${user.id}:`, daftarUlang);
    }
  }
}
run();
