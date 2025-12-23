/**
 * Script to update batch data for 2026
 * Start date: 5 Januari 2026 (2026-01-05)
 * Duration: 13 pekan
 * End date: 7 April 2026 (2026-04-07)
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function updateBatch() {
  try {
    console.log('Starting batch update...');

    // First, let's check existing batches
    const { data: existingBatches, error: fetchError } = await supabase
      .from('batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching existing batches:', fetchError);
      return;
    }

    console.log('Existing batches:', existingBatches);

    // Close old batches
    const { error: closeError } = await supabase
      .from('batches')
      .update({
        status: 'closed',
        updated_at: new Date().toISOString()
      })
      .lt('start_date', '2026-01-01')
      .neq('status', 'closed');

    if (closeError) {
      console.error('Error closing old batches:', closeError);
    } else {
      console.log('Old batches closed successfully');
    }

    // Check if batch with name 'Batch 2026 - Tikrar MTI' exists
    const { data: existingBatch, error: checkError } = await supabase
      .from('batches')
      .select('*')
      .eq('name', 'Batch 2026 - Tikrar MTI')
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing batch:', checkError);
    }

    if (existingBatch) {
      // Update existing batch
      const { data, error } = await supabase
        .from('batches')
        .update({
          description: 'Batch program Tikrar Tahfidz MTI tahun 2026',
          start_date: '2026-01-05',
          end_date: '2026-04-07',
          registration_start_date: '2025-12-20',
          registration_end_date: '2026-01-04',
          status: 'open',
          duration_weeks: 13,
          program_type: 'tikrah',
          total_quota: 100,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingBatch.id)
        .select();

      if (error) {
        console.error('Error updating batch:', error);
      } else {
        console.log('Batch updated successfully:', data);
      }
    } else {
      // Create new batch
      const { data, error } = await supabase
        .from('batches')
        .insert({
          name: 'Batch 2026 - Tikrar MTI',
          description: 'Batch program Tikrar Tahfidz MTI tahun 2026',
          start_date: '2026-01-05',
          end_date: '2026-04-07',
          registration_start_date: '2025-12-20',
          registration_end_date: '2026-01-04',
          status: 'open',
          duration_weeks: 13,
          program_type: 'tikrah',
          total_quota: 100
        })
        .select();

      if (error) {
        console.error('Error creating batch:', error);
      } else {
        console.log('Batch created successfully:', data);
      }
    }

    // Verify the update
    const { data: finalBatches, error: verifyError } = await supabase
      .from('batches')
      .select('*')
      .eq('status', 'open');

    if (verifyError) {
      console.error('Error verifying update:', verifyError);
    } else {
      console.log('Final open batches:', finalBatches);
    }

    console.log('Batch update completed!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

updateBatch();
