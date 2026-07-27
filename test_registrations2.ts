import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: user } = await supabaseAdmin.from('users').select('id').ilike('full_name', '%Dewi Nurhayati%').single();
  
  if (user) {
    const { data } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select(`
        *,
        daftar_ulang:daftar_ulang_submissions(*)
      `)
      .eq('user_id', user.id);
      
    console.log(JSON.stringify(data.find(d => d.batch_id === '2478b493-1b6b-412a-a05f-6193db815a43')?.daftar_ulang, null, 2));
  }
}
check();
