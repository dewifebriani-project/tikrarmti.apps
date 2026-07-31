import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: batches, error } = await supabase.from('batches').select('id, name').order('created_at', { ascending: false }).limit(2);
  
  console.log('Batch IDs error:', error);
  console.log('Batch IDs:', batches);

  for (const b of (batches || [])) {
    const { data: thalibahs, error: thalibahError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('id, status, selection_status, program_id, programs!inner(class_type)')
      .eq('batch_id', b.id);

    console.log(`Thalibah for batch ${b.name}: error:`, thalibahError?.message || null);
    console.log(`Thalibah data count:`, thalibahs?.length);
  }
}

main().catch(console.error);
