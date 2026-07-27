import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function checkSubmissions() {
  const { data, error } = await supabaseAdmin
    .from('daftar_ulang_submissions')
    .select('id, user_id, status, confirmed_full_name, created_at')
    .ilike('confirmed_full_name', '%Dewi Nurhayati%')
    
  if (error) {
    console.error('Error fetching submissions:', error);
  } else {
    console.log(`Found data:`, data);
  }
}

checkSubmissions();
