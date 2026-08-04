const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: batch, error: fetchError } = await supabase
    .from('batches')
    .select('id')
    .ilike('name', '%Batch 3%')
    .single();

  if (fetchError) {
    console.error('Error fetching batch:', fetchError);
    return;
  }
  
  const { error: updateError } = await supabase
    .from('batches')
    .update({
      whatsapp_group_link: 'https://chat.whatsapp.com/JYVgMQ9MUn53rsTAWZ557v?s=cl&p=a&ilr=4&amv=3',
      group_reminder_link: 'https://chat.whatsapp.com/FzfSpfMvZOgAeTLwAiJCzU?s=cl&p=a&ilr=4&amv=3',
      group_diskusi_link: 'https://chat.whatsapp.com/HHcPFXsqkrBBDEuUvuGBMK?s=cl&p=a&ilr=4&amv=3'
    })
    .eq('id', batch.id);

  if (updateError) {
    console.error('Error updating batch:', updateError);
  } else {
    console.log('Successfully updated Batch 3 links!');
  }
}

run();
