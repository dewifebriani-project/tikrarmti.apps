import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load env
dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceKey);

async function check() {
  const { data, error } = await supabase
    .from('pendaftaran_tikrar_tahfidz')
    .select('id, full_name, batch_name, batch_id, status, selection_status')
    .ilike('full_name', '%Aam%');

  if (error) {
    console.error('Fetch failed:', error);
    return;
  }

  console.log('--- Aam Registrations in Database ---');
  data.forEach((r: any) => {
    console.log(`ID: ${r.id} | Name: ${r.full_name} | Batch Name: ${r.batch_name} | Batch ID: ${r.batch_id} | Status: ${r.status} | Selection: ${r.selection_status}`);
  });
}

check().catch(console.error);
