const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name')
    .or('full_name.ilike.%Anisa Syami%,full_name.ilike.%Fani Purwandari%');
    
  if (users?.length) {
    const userIds = users.map(u => u.id);
    
    // In the application, "is_mutual_match" is computed, probably inside an RPC or in Next.js API.
    // Let's check the database schema to see if there is an RPC.
    
    // Also, Anisa Syami has another registration for batch 4bcb... where she chose someone else.
    // Why is her status 'draft'? Maybe she edited her halaqah/partner but didn't click submit yet.
    
    console.log("We know Anisa Syami's status is draft for batch 2478b493...");
  }
}

check();
