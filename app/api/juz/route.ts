import { NextResponse, NextRequest } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedBatchId = searchParams.get('batchId');
    const examOnly = searchParams.get('examOnly') === 'true';

    let batchIdToUse = requestedBatchId;

    // If no batchId is provided, try to find an 'open' batch
    if (!batchIdToUse) {
      const { data: openBatch, error: batchError } = await supabaseAdmin
        .from('batches')
        .select('id')
        .eq('status', 'open')
        .limit(1)
        .single();
      
      if (!batchError && openBatch) {
        batchIdToUse = openBatch.id;
      }
    }

    // Get all juz options, ordered by sort_order
    const { data: allJuz, error: juzError } = await supabaseAdmin
      .from('juz_options')
      .select('*')
      .order('sort_order', { ascending: true });

    if (juzError) {
      console.error('Error fetching juz options:', juzError);
      return NextResponse.json(
        { error: 'Failed to fetch juz options' },
        { status: 500 }
      );
    }

    let activeJuzOptions = allJuz.filter(juz => juz.is_active);

    // The written-test target list follows the new-thalibah registration form.
    // Only target Bagian A is selectable. This is separate from the question
    // package: selection exams still load Paket B questions in the exam API.
    if (examOnly) {
      activeJuzOptions = activeJuzOptions.filter(
        option => option.part === 'A' && option.juz_number !== 30
      );
    }

    return NextResponse.json({ data: activeJuzOptions || [] });
  } catch (error) {
    console.error('Error in juz API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
