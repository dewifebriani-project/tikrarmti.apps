import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: attempts } = await supabaseAdmin
    .from('akad_quiz_attempts')
    .select('*')
    .eq('user_id', 'dc6817d2-6cc1-4197-b8a7-4152b302920d')
    .order('created_at', { ascending: false });
    
  const response = { data: attempts || [] };
  
  console.log("JSON response:", JSON.stringify(response, null, 2));
  console.log("hasPassed:", response?.data?.[0]?.passed === true);
}
check();
