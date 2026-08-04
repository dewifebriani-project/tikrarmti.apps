const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const tables = ['daily_journals', 'journals', 'presences', 'jurnal_harian', 'student_journals'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('id').limit(1);
    if (!error) console.log("Found table:", t);
  }
}
main();
