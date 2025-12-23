/**
 * Script to close old batches
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function closeOldBatches() {
  try {
    console.log('Closing old batches...');

    // Close Batch 2025 - Program Guru MTI (48 weeks)
    const { data: guruBatch, error: guruError } = await supabase
      .from('batches')
      .select('id, name')
      .eq('name', 'Batch 2025 - Program Guru MTI')
      .single();

    if (guruBatch) {
      const { error: updateError } = await supabase
        .from('batches')
        .update({ status: 'closed', updated_at: new Date().toISOString() })
        .eq('id', guruBatch.id);

      if (updateError) {
        console.error('Error closing Guru batch:', updateError);
      } else {
        console.log('Closed: Batch 2025 - Program Guru MTI');
      }
    }

    // Close Tikrar Tahfidz MTI Batch 2 (keep only Batch 2026 - Tikrar MTI)
    const { data: batch2, error: batch2Error } = await supabase
      .from('batches')
      .select('id, name')
      .eq('name', 'Tikrar Tahfidz MTI Batch 2')
      .single();

    if (batch2) {
      const { error: updateError } = await supabase
        .from('batches')
        .update({ status: 'closed', updated_at: new Date().toISOString() })
        .eq('id', batch2.id);

      if (updateError) {
        console.error('Error closing Batch 2:', updateError);
      } else {
        console.log('Closed: Tikrar Tahfidz MTI Batch 2');
      }
    }

    // Verify final open batches
    const { data: openBatches } = await supabase
      .from('batches')
      .select('*')
      .eq('status', 'open');

    console.log('\nFinal open batches:');
    openBatches.forEach(b => {
      console.log(`- ${b.name}: ${b.start_date} (${b.duration_weeks} weeks)`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

closeOldBatches();
