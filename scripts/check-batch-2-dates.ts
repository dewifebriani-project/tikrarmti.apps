import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserBatch() {
  console.log('Checking user batch...');

  // Get user's registration to find batch_id
  const { data: registrations, error: regError } = await supabase
    .from('pendaftaran_tikrar_tahfidz')
    .select('batch_id, user_id, full_name')
    .eq('full_name', 'Dewi Febriani')
    .limit(1);

  if (regError) {
    console.error('Error fetching registrations:', regError);
    return;
  }

  console.log('Registrations:', registrations);

  if (registrations && registrations.length > 0) {
    const batchId = registrations[0].batch_id;
    console.log('Batch ID:', batchId);

    // Get batch details
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('*')
      .eq('id', batchId)
      .single();

    if (batchError) {
      console.error('Error fetching batch:', batchError);
      return;
    }

    console.log('\n=== Batch Details ===');
    console.log('Name:', batch.name);
    console.log('re_enrollment_date:', batch.re_enrollment_date);
    console.log('opening_class_date:', batch.opening_class_date);
    console.log('first_week_start_date:', batch.first_week_start_date);
    console.log('first_week_end_date:', batch.first_week_end_date);
    console.log('review_week_start_date:', batch.review_week_start_date);
    console.log('review_week_end_date:', batch.review_week_end_date);
    console.log('final_exam_start_date:', batch.final_exam_start_date);
    console.log('final_exam_end_date:', batch.final_exam_end_date);
    console.log('graduation_start_date:', batch.graduation_start_date);
    console.log('graduation_end_date:', batch.graduation_end_date);

    // Check all batches
    const { data: allBatches } = await supabase
      .from('batches')
      .select('id, name');

    console.log('\n=== All Batches ===');
    allBatches?.forEach(b => {
      console.log(`${b.name}: ${b.id}`);
    });
  }
}

checkUserBatch()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
