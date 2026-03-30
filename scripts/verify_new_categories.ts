import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Supabase credentials missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verify() {
  console.log('🧪 Verifying Database Constraints for Anak/Teman...');
  
  const testData = {
    user_id: '00000000-0000-0000-0000-000000000000', // Dummy but valid UUID format for constraint test
    tanggal_setor: new Date().toISOString().split('T')[0],
    tikrar_bi_al_ghaib_type: 'keluarga_40_anak',
    tikrar_bi_al_ghaib_40x: ['keluarga_40_anak'],
    blok: 'H1A'
  };

  const { error } = await supabase
    .from('jurnal_records')
    .insert(testData)
    .select();

  if (error) {
    if (error.message.includes('violates check constraint')) {
      console.error('❌ FAILED: Still violating constraint!', error.message);
    } else {
      // If it's a Foreign Key error for dummy user_id, that's OK! It means the CHECK constraint passed!
      if (error.message.includes('violates foreign key constraint "jurnal_records_user_id_fkey"')) {
        console.log('✅ SUCCESS: Check constraint passed (Foreign key blocked insertion as expected for dummy user).');
      } else {
        console.error('⚠️ UNKNOWN ERROR:', error.message);
      }
    }
  } else {
    console.log('✅ SUCCESS: Inserted record successfully (if dummy user was miraculously valid).');
  }
}

verify().catch(console.error);
