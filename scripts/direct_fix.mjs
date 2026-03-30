import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const sql = `
ALTER TABLE public.jurnal_records DROP CONSTRAINT IF EXISTS jurnal_records_tikrar_bi_al_ghaib_40x_check;
ALTER TABLE public.jurnal_records DROP CONSTRAINT IF EXISTS jurnal_records_tikrar_bi_al_ghaib_type_check;

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
    ]::text[]
);
`

async function main() {
  console.log('Sending SQL...')
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Success:', data)
  }
}

main()
