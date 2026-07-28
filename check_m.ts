import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function check() {
  const batchId = '2478b493-1b6b-412a-a05f-6193db815a43';

  // Fetch muallimah registrations for this batch
  const { data: muallimahRegs } = await supabaseAdmin
    .from('muallimah_registrations')
    .select('user_id, class_type, full_name')
    .eq('batch_id', batchId)
    .eq('status', 'approved')

  console.log('Muallimah Regs:');
  muallimahRegs?.forEach(reg => console.log(`  - ${reg.full_name} | class_type: "${reg.class_type}"`));
}
check();
