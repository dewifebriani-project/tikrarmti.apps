const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function fix() {
  const userId = '902b0145-14b1-4d18-9553-0cf7372112bf';
  const faridaHalaqahId = '31e782c0-d387-45ea-83a1-fa4797395e5b';
  const suciHalaqahId = '6e05753a-3a7a-4d7d-927d-5d8f5526213a';
  const batchId = '2478b493-1b6b-412a-a05f-6193db815a43';

  console.log('Removing from Farida...');
  const { error: err1 } = await supabase.from('halaqah_students')
    .delete()
    .eq('thalibah_id', userId)
    .eq('halaqah_id', faridaHalaqahId);
  if(err1) console.error(err1);

  console.log('Updating daftar_ulang_submissions to Suci...');
  const { error: err2 } = await supabase.from('daftar_ulang_submissions')
    .update({ 
      ujian_halaqah_id: suciHalaqahId, 
      tashih_halaqah_id: suciHalaqahId 
    })
    .eq('user_id', userId)
    .eq('batch_id', batchId);
  if(err2) console.error(err2);

  console.log('Done!');
}
fix();
