const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key);

async function test() {
  const { data: batch } = await supabase.from('batches').select('id').eq('status', 'open').single();
  
  const { data, error } = await supabase
    .from('pendaftaran_tikrar_tahfidz')
    .select('*')
    .eq('batch_id', batch.id)
    .limit(1);
    
  if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
  }
  console.log('Error:', error);
}
test();
