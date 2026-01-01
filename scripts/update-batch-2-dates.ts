import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateBatch2Dates() {
  console.log('Updating Batch 2 timeline dates...');

  // Batch 2 ID based on earlier query
  const batch2Id = '4bcb3020-20cb-46e2-8be4-0100f8012a49';

  const { data, error } = await supabase
    .from('batches')
    .update({
      selection_start_date: '2025-01-01',
      selection_end_date: '2025-01-14',
      selection_result_date: '2025-01-16',
    })
    .eq('id', batch2Id)
    .select();

  if (error) {
    console.error('Error updating batch:', error);
    process.exit(1);
  }

  console.log('Batch 2 updated successfully:', data);

  // Verify
  const { data: batch } = await supabase
    .from('batches')
    .select('*')
    .eq('id', batch2Id)
    .single();

  console.log('\n=== Verification ===');
  console.log('Batch:', batch.name);
  console.log('Registration Start:', batch.registration_start_date);
  console.log('Registration End:', batch.registration_end_date);
  console.log('Selection Start:', batch.selection_start_date);
  console.log('Selection End:', batch.selection_end_date);
  console.log('Selection Result:', batch.selection_result_date);
  console.log('Re-enrollment:', batch.re_enrollment_date);
  console.log('Opening Class:', batch.opening_class_date);
}

updateBatch2Dates()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
