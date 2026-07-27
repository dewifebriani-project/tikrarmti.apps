import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function revertAllSubmissions() {
  console.log('Reverting all submitted submissions to draft...');
  
  const { data, error } = await supabaseAdmin
    .from('daftar_ulang_submissions')
    .update({ 
      status: 'draft',
      updated_at: new Date().toISOString()
    })
    .eq('status', 'submitted')
    .select('id, confirmed_full_name');
    
  if (error) {
    console.error('Error updating submissions:', error);
  } else {
    console.log(`Successfully reverted ${data?.length || 0} submissions to draft.`);
    if (data && data.length > 0) {
      console.log('First few reverted:', data.slice(0, 3));
    }
  }
}

revertAllSubmissions();
