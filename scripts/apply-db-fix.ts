import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Supabase credentials missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const sqlQuery = `
-- EMERGENCY FIX FOR JURNAL RECORDS CONSTRAINTS
DO $$
BEGIN
    -- 1. Drop the constraints by name
    ALTER TABLE public.jurnal_records DROP CONSTRAINT IF EXISTS jurnal_records_tikrar_bi_al_ghaib_40x_check;
    ALTER TABLE public.jurnal_records DROP CONSTRAINT IF EXISTS jurnal_records_tikrar_bi_al_ghaib_type_check;

    -- 2. Add them back with the NEW values
    ALTER TABLE public.jurnal_records ADD CONSTRAINT jurnal_records_tikrar_bi_al_ghaib_type_check 
    CHECK (
        tikrar_bi_al_ghaib_type IS NULL OR 
        tikrar_bi_al_ghaib_type = '' OR 
        tikrar_bi_al_ghaib_type IN (
            'pasangan_40', 'pasangan_40_wa', 'keluarga_40', 
            'keluarga_40_suami', 'keluarga_40_ayah', 'keluarga_40_ibu', 
            'keluarga_40_kakak', 'keluarga_40_adik', 'keluarga_40_saudara',
            'keluarga_40_anak', 'keluarga_40_teman', 'tarteel_40',
            'pasangan_20', 'pasangan_20_wa', 'voice_note_20'
        )
    );

    ALTER TABLE public.jurnal_records ADD CONSTRAINT jurnal_records_tikrar_bi_al_ghaib_40x_check
    CHECK (
        tikrar_bi_al_ghaib_40x IS NULL OR 
        array_length(tikrar_bi_al_ghaib_40x, 1) = 0 OR
        tikrar_bi_al_ghaib_40x <@ ARRAY[
            'pasangan_40', 'pasangan_40_wa', 'keluarga_40', 
            'keluarga_40_suami', 'keluarga_40_ayah', 'keluarga_40_ibu', 
            'keluarga_40_kakak', 'keluarga_40_adik', 'keluarga_40_saudara',
            'keluarga_40_anak', 'keluarga_40_teman', 'tarteel_40'
        ]::TEXT[]
    );
END $$;
`;

async function applyFix() {
  console.log('🚀 Applying Database Fix via RPC exec_sql...');
  
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: sqlQuery
  });

  if (error) {
    console.error('❌ RPC Error:', error);
    process.exit(1);
  }

  console.log('✅ Result:', data);
}

applyFix().catch(console.error);
