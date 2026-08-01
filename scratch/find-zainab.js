import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: halaqahs } = await supabase
    .from('halaqah')
    .select('id, name, max_students, users!muallimah_id(full_name)')
    .ilike('name', '%Zainab%');
    
  console.log('Zainab halaqahs:', halaqahs);
  
  if (halaqahs && halaqahs.length > 0) {
    for (const h of halaqahs) {
      const { data: subs } = await supabase
        .from('daftar_ulang_submissions')
        .select('*')
        .or(`ujian_halaqah_id.eq.${h.id},tashih_halaqah_id.eq.${h.id}`);
      console.log(`Submissions for ${h.id}:`, subs?.length);
      
      const { data: students } = await supabase
        .from('halaqah_students')
        .select('*')
        .eq('halaqah_id', h.id);
      console.log(`Students for ${h.id}:`, students?.length);
    }
  }
}
check();
