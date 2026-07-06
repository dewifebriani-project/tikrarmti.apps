import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  console.log('--- REGISTRATION QUESTIONS ---');
  const { data: regQs, error: err1 } = await supabase
    .from('registration_questions')
    .select('id, field_key, section, label, input_type, options, is_active')
    .order('section', { ascending: true })
    .order('sort_order', { ascending: true });

  if (err1) {
    console.error('Error fetching registration_questions:', err1);
  } else {
    for (const q of regQs || []) {
      console.log(`[Sec ${q.section}] Key: ${q.field_key} | Label: ${q.label} | Type: ${q.input_type} | Options: ${JSON.stringify(q.options)} | Active: ${q.is_active}`);
    }
  }

  console.log('\n--- REREGISTRATION (DAFTAR ULANG) QUESTIONS ---');
  const { data: reregQs, error: err2 } = await supabase
    .from('reregistration_questions')
    .select('id, field_key, section, label, input_type, options, is_active')
    .order('section', { ascending: true })
    .order('sort_order', { ascending: true });

  if (err2) {
    console.error('Error fetching reregistration_questions:', err2);
  } else {
    for (const q of reregQs || []) {
      console.log(`[Sec ${q.section}] Key: ${q.field_key} | Label: ${q.label} | Type: ${q.input_type} | Options: ${JSON.stringify(q.options)} | Active: ${q.is_active}`);
    }
  }
}

run().catch(console.error);
