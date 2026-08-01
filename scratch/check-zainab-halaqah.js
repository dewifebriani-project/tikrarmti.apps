import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: halaqah } = await supabase
    .from('halaqah')
    .select('id, name, muallimah_id, users!muallimah_id(full_name)')
    .eq('id', '6f594f65-8dc9-40c0-9ea3-a2363750cdf1')
    .single();
    
  console.log(halaqah);
}
check();
