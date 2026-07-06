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
    .select('id, full_name, oral_total_score, oral_assessment_status, selection_status, oral_makhraj_errors, oral_sifat_errors, oral_mad_errors, oral_ghunnah_errors, oral_harakat_errors, oral_itmamul_harakat_errors')
    .or('full_name.ilike.%Kardina%,full_name.ilike.%Dewi%');

  if (error) {
    console.error('Fetch failed:', error);
    return;
  }

  console.log('--- Targeted Registrations in Database ---');
  data.forEach((r: any) => {
    console.log(`ID: ${r.id}`);
    console.log(`Name: ${r.full_name}`);
    console.log(`Oral Score: ${r.oral_total_score}`);
    console.log(`Assessment Status: ${r.oral_assessment_status}`);
    console.log(`Selection Status: ${r.selection_status}`);
    console.log(`Errors: Makhraj: ${r.oral_makhraj_errors}, Sifat: ${r.oral_sifat_errors}, Mad: ${r.oral_mad_errors}, Ghunnah: ${r.oral_ghunnah_errors}, Harakat: ${r.oral_harakat_errors}, Itmamul: ${r.oral_itmamul_harakat_errors}`);
    console.log('-----------------------------------------');
  });
}

check().catch(console.error);
