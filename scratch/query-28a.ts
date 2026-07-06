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
    .select('id, full_name, chosen_juz, oral_submission_url, oral_assessment_audio_url, status, selection_status')
    .eq('chosen_juz', '28A');

  if (error) {
    console.error('Fetch failed:', error);
    return;
  }

  console.log('--- Registrations with Juz 28A in Database ---');
  data.forEach((r: any) => {
    console.log(`ID: ${r.id} | Name: ${r.full_name}`);
    console.log(`Oral URL: ${r.oral_submission_url}`);
    console.log(`Feedback URL: ${r.oral_assessment_audio_url}`);
    console.log('-----------------------------------------');
  });
}

check().catch(console.error);
