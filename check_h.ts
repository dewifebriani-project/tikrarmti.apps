import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function check() {
  const batchId = '2478b493-1b6b-412a-a05f-6193db815a43';

  const { data: halaqah } = await supabaseAdmin
    .from('halaqah')
    .select(`
      id, name,
      programs!inner(batch_id, class_type)
    `)
    .eq('status', 'active')
    .eq('programs.batch_id', batchId)
    .limit(5);

  console.log('Halaqah:');
  halaqah?.forEach(h => {
    const prog = Array.isArray(h.programs) ? h.programs[0] : h.programs;
    console.log(`  - ${h.name} | program.class_type: "${(prog as any)?.class_type}"`);
  });
}
check();
