import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: programs, error } = await supabase
    .from('programs')
    .select('*');
  
  for (const p of programs || []) {
    let newType = null;
    const name = p.name.toLowerCase();
    if (name.includes('pra-tikrar') || name.includes('pra tikrar')) {
      newType = 'pra_tahfidz';
    } else if (name.includes('tahfidz tikrar') || name.includes('tikrar tahfidz') || name.includes('tikrar mti')) {
      newType = 'tikrar_tahfidz';
    }
    
    if (newType && p.class_type !== newType) {
      console.log(`Updating program ${p.name} to ${newType}`);
      await supabase.from('programs').update({ class_type: newType }).eq('id', p.id);
    }
  }
  console.log('Done');
}
main();
