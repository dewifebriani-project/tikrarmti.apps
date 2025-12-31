import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateBatchDates() {
  console.log('Updating Batch 3 timeline dates...');

  // Update batch dates
  const { data, error } = await supabase
    .from('batches')
    .update({
      selection_start_date: '2025-01-01',
      selection_end_date: '2025-01-14',
      selection_result_date: '2025-01-16',
      re_enrollment_date: '2026-01-01',
      opening_class_date: '2026-01-05',
      first_week_start_date: '2026-01-12',
      first_week_end_date: '2026-01-18',
      review_week_start_date: '2026-03-30',
      review_week_end_date: '2026-04-05',
      final_exam_start_date: '2026-04-06',
      final_exam_end_date: '2026-04-12',
      graduation_start_date: '2026-04-13',
      graduation_end_date: '2026-04-19',
    })
    .eq('name', 'Tikrar Tahfidz MTI Batch 3')
    .select();

  if (error) {
    console.error('Error updating batch:', error);
    process.exit(1);
  }

  console.log('Batch updated successfully:', data);

  // Verify the update
  const { data: batch, error: fetchError } = await supabase
    .from('batches')
    .select('*')
    .eq('name', 'Tikrar Tahfidz MTI Batch 3')
    .single();

  if (fetchError) {
    console.error('Error fetching batch:', fetchError);
    process.exit(1);
  }

  console.log('\n=== Verification ===');
  console.log('Batch:', batch.name);
  console.log('Re-enrollment Date:', batch.re_enrollment_date);
  console.log('Opening Class Date:', batch.opening_class_date);
  console.log('First Week:', batch.first_week_start_date, 'to', batch.first_week_end_date);
  console.log('Review Week:', batch.review_week_start_date, 'to', batch.review_week_end_date);
  console.log('Final Exam:', batch.final_exam_start_date, 'to', batch.final_exam_end_date);
  console.log('Graduation:', batch.graduation_start_date, 'to', batch.graduation_end_date);
}

updateBatchDates()
  .then(() => {
    console.log('\n✓ Batch 3 dates updated successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
