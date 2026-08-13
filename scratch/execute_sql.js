const { createClient } = require('@supabase/supabase-js');

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check the definitions by intentionally creating a bad insert and observing the error details, OR
  // We can query pg_constraint if we have rpc. But we don't.
  
  // Let's just select Eka Sriharyanti from users, muallimah_registrations, and muallimah_akads
  const { data: user, error: e1 } = await supabase.from('users').select('*').ilike('full_name', '%Eka sri%').single();
  console.log("User:", user);
  
  if (user) {
    const { data: reg, error: e2 } = await supabase.from('muallimah_registrations').select('*').eq('user_id', user.id);
    console.log("Muallimah Registrations:", reg);
    
    const { data: akad, error: e3 } = await supabase.from('muallimah_akads').select('*').eq('user_id', user.id);
    console.log("Muallimah Akads:", akad);
  }
}
run();
