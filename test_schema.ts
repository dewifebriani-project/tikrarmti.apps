import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabaseAdmin
    .from('akad_quiz_attempts')
    .select('passed')
    .limit(1);
    
  if (data && data.length > 0) {
    console.log('Type of passed:', typeof data[0].passed);
    console.log('Value:', data[0].passed);
  }
}

check();
