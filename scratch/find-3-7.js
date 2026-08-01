import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: halaqahs } = await supabase
    .from('halaqah')
    .select('id, name, max_students, users!muallimah_id(full_name)')
    .eq('max_students', 7);
    
  if (halaqahs && halaqahs.length > 0) {
    for (const h of halaqahs) {
      const { data: subs } = await supabase
        .from('daftar_ulang_submissions')
        .select('*')
        .or(`ujian_halaqah_id.eq.${h.id},tashih_halaqah_id.eq.${h.id}`);
      
      const { data: students } = await supabase
        .from('halaqah_students')
        .select('*')
        .eq('halaqah_id', h.id);
        
      if (subs?.length === 3 || students?.length === 3) {
        console.log(`FOUND 3: ${h.name} by ${h.users?.full_name}`);
        console.log(`Submissions for ${h.id}:`, subs?.length);
        console.log(`Students for ${h.id}:`, students?.length);
        
        // Print API response for this halaqah simulating admin user
        const userIds = [
          ...(students?.map(s => s.thalibah_id) || []),
          ...(subs?.map(s => s.user_id) || [])
        ].filter(Boolean);
        
        console.log('User IDs:', userIds);
      }
    }
  }
}
check();
