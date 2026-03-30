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

const VALID_40X = [
  'pasangan_40', 'pasangan_40_wa', 'keluarga_40', 
  'keluarga_40_suami', 'keluarga_40_ayah', 'keluarga_40_ibu', 
  'keluarga_40_kakak', 'keluarga_40_adik', 'keluarga_40_saudara',
  'keluarga_40_anak', 'keluarga_40_teman', 'tarteel_40'
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

  if (typeError) console.error('Error checking types:', typeError);
  else if (typeViolations && typeViolations.length > 0) {
    console.log('⚠️ Found records with illegal tikrar_bi_al_ghaib_type:', typeViolations);
  } else {
    console.log('✅ No illegal tikrar_bi_al_ghaib_type found.');
  }

  // 2. Check tikrar_bi_al_ghaib_40x (Array)
  // This is harder via JS client without heavy fetching, so let's try a small sample or RPC if exists
  console.log('🔍 Checking arrays is best done via SQL or fetching a sample...');
  
  const { data: sample, error: sampleError } = await supabase
    .from('jurnal_records')
    .select('id, tikrar_bi_al_ghaib_40x, tikrar_bi_al_ghaib_20x')
    .limit(100);

  if (sampleError) console.error('Error fetching sample:', sampleError);
  else {
    let arrayViolations = 0;
    sample.forEach(row => {
      if (row.tikrar_bi_al_ghaib_40x) {
        row.tikrar_bi_al_ghaib_40x.forEach(val => {
          if (!VALID_40X.includes(val)) {
            console.log(`⚠️ Invalid 40x value "${val}" in record ${row.id}`);
            arrayViolations++;
          }
        });
      }
    });
    console.log(`✅ Sample check complete (${sample.length} records checked). Array violations suspected: ${arrayViolations}`);
  }
}

checkViolations().catch(console.error);
