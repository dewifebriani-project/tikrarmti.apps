import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Supabase credentials missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const VALID_TYPES = [
  'pasangan_40', 'pasangan_40_wa', 'keluarga_40', 
  'keluarga_40_suami', 'keluarga_40_ayah', 'keluarga_40_ibu', 
  'keluarga_40_kakak', 'keluarga_40_adik', 'keluarga_40_saudara',
  'keluarga_40_anak', 'keluarga_40_teman', 'tarteel_40',
  'pasangan_20', 'pasangan_20_wa', 'voice_note_20'
];

async function checkViolations() {
  console.log('🔍 Checking for potential constraint violations in public.jurnal_records...');
  
  // 1. Check tikrar_bi_al_ghaib_type
  const { data: typeViolations, error: typeError } = await supabase
    .from('jurnal_records')
    .select('id, tikrar_bi_al_ghaib_type')
    .not('tikrar_bi_al_ghaib_type', 'is', null)
    .not('tikrar_bi_al_ghaib_type', 'eq', '')
    .not('tikrar_bi_al_ghaib_type', 'in', `(${VALID_TYPES.join(',')})`);

  if (typeError) {
    console.error('❌ Error checking types:', typeError.message);
  } else if (typeViolations && typeViolations.length > 0) {
    console.log('⚠️ Found records with illegal types:', typeViolations);
  } else {
    console.log('✅ No illegal tikrar_bi_al_ghaib_type found.');
  }

  // 2. Check for empty strings that might be converted to NULL or kept empty
  const { count, error: countError } = await supabase
    .from('jurnal_records')
    .select('*', { count: 'exact', head: true })
    .eq('tikrar_bi_al_ghaib_type', '');

  if (countError) console.error('Error counting empty strings:', countError.message);
  else console.log(`ℹ️ Records with empty string type: ${count}`);
}

checkViolations().catch(console.error);
