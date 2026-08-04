const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: batch, error } = await supabase
    .from('batches')
    .select('*')
    .ilike('name', '%Batch 3%')
    .single();

  if (error) {
    console.error('Error fetching batch:', error);
    return;
  }
  
  console.log('Found batch:', batch.name);
  console.log('Current keys:', Object.keys(batch).filter(k => k.includes('group') || k.includes('whatsapp') || k.includes('link')));
}

run();
