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
    .select('id, full_name, oral_total_score, oral_assessment_status, selection_status')
    .eq('oral_total_score', 100);

  if (error) {
    console.error('Fetch failed:', error);
    return;
  }

  console.log('--- Registrations with Score 100 in Database ---');
  data.forEach((r: any) => {
    console.log(`ID: ${r.id} | Name: ${r.full_name} | Score: ${r.oral_total_score} | Assessment: ${r.oral_assessment_status}`);
  });
}

check().catch(console.error);
